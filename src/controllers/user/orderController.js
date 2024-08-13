const CustomError = require("../../constants/CustomError")
const { viewUsersPage, viewPageNotFound } = require("../../constants/pageConfid")
const orderModel = require('../../model/orderModel')
const mongoose = require("mongoose")
const { getOrderDetailsAggregation } = require("../../helpers/aggregationPipelines")
const htmlToPdf = require('html-pdf-node')
const ejs = require('ejs')
const path = require('path')
const { OK, BAD_REQUEST, NOT_FOUND, CREATED, CONFLICT, GONE } = require("../../constants/httpStatusCodes")
const cartModel = require("../../model/cartModel")
const productModel = require("../../model/productModel")
const addressModel = require("../../model/addressModel")
const couponModel = require("../../model/couponModel")
const usedCouponsModel = require("../../model/usedCouponsModel")
const paypal = require('@paypal/checkout-server-sdk')
const CC = require('currency-converter-lt')
const { validateOrderStatusTransactions, orderStatusValues, paymentStatusValues } = require('../../constants/statusValues')
const walletModel = require("../../model/walletModel")
const { cancelOrReturnWholeOrder } = require("../../helpers/orderHelpers")
const { createLedgerBookTransaction } = require("../../helpers/ledgerBookHelpers")


let currencyConverter = new CC({ from: "INR", to: "USD", amount: 100 })

const Environment =
  process.env.NODE_ENV === 'prod'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment

const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
)


const getAllOrdersPageController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const user = JSON.parse(req.cookies.user)
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await orderModel.countDocuments({ userId: user.userId })
    const numberOfPages = Math.ceil(total / LIMIT)

    const ordersWithProducts = await orderModel.aggregate([
      {
        $match: {
          userId: user.userId
        }
      },
      {
        $unwind: '$products'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $set: {
          'products.name': { $arrayElemAt: ['$productDetails.name', 0] },
          'products.image': { $arrayElemAt: ['$productDetails.image', 0] }
        }
      },
      {
        $unset: 'productDetails'
      },
      {
        $group: {
          _id: '$_id',
          userId: { $first: '$userId' },
          addressId: { $first: '$addressId' },
          orderStatus: { $first: '$orderStatus' },
          total: { $first: '$total' },
          paymentMethod: { $first: '$paymentMethod' },
          coupon: { $first: '$coupon' },
          paymentStatus: { $first: '$paymentStatus' },
          products: { $push: '$products' },
          createdAt: { $first: "$createdAt" }
        }
      },
      {
        $project: {
          userId: 1,
          addressId: 1,
          orderStatus: 1,
          total: 1,
          paymentMethod: 1,
          coupon: 1,
          paymentStatus: 1,
          products: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: LIMIT }
    ])

    res.render('user/profile/orders', {
      ...viewUsersPage,
      orders: ordersWithProducts,
      page,
      numberOfPages
    })
  } catch (error) {
    next(error)
  }
}

const getOrderDetailsPageController = async (req, res, next) => {
  let { orderId, isInvoiceDownload = false } = req.query
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      console.log('invalid order Id')
      res.render('user/notfound/notFound', { ...viewPageNotFound, backToAdmin: false })
      return
    }
    orderId = mongoose.Types.ObjectId.createFromHexString(orderId)
    const orderDetails = await getOrderDetailsAggregation({ orderId })

    // * invoice pdf download
    if (isInvoiceDownload) {
      const filePath = path.join(__dirname, '../../../views/user/profile/orderDetails.ejs')
      const renderedFile = await ejs.renderFile(filePath, {
        ...viewUsersPage,
        order: orderDetails,
        isInvoiceDownload: true,
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
      })
      const file = { content: renderedFile }
      const options = { format: 'A4' }
      const pdfBuffer = await htmlToPdf.generatePdf(file, options)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment;filename="invoice.pdf"');
      res.status(OK).send(pdfBuffer);
      return
    }


    res.render('user/profile/orderDetails', {
      ...viewUsersPage,
      order: orderDetails,
      isInvoiceDownload: false,
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
    })
  } catch (error) {
    next(error)
  }
}


const orderUsingCodController = async (req, res, next) => {
  const { addressId, isContinuePayment = false, orderId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    if (!mongoose.isObjectIdOrHexString(addressId)) {
      throw new CustomError("invalid address id", BAD_REQUEST)
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      throw new CustomError('Address not found', BAD_REQUEST);
    }

    let cart
    if (isContinuePayment) {
      if (!mongoose.isObjectIdOrHexString(orderId)) {
        throw new CustomError('invalid orderId', BAD_REQUEST)
      }
      cart = await orderModel.findOne({ _id: orderId })
    } else {
      cart = await cartModel.findOne({ userId: user.userId });
    }

    if (!cart || cart.products.length === 0) {
      throw new CustomError('Cart is empty', BAD_REQUEST);
    }

    if (cart.total > 1000) {
      throw new CustomError('change payment method to make payment above 1000', BAD_REQUEST)
    }

    // * decreasing stock
    for (const item of cart.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError('Product not found', BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for product: ${product.name}`, BAD_REQUEST);
      }
      product.stock -= item.quantity;
      await product.save();
    }

    // * return here
    if (isContinuePayment) {
      const newOrder = await orderModel.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            paymentMethod: 'cod',
            paymentStatus: 'Pending',
          }
        },
        { new: true }
      )
      res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
      return
    }


    const newOrder = await orderModel.create({
      addressId: address._id,
      orderStatus: 'Pending',
      products: cart.products,
      originalTotal: cart.total,
      total: cart.total,
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      userId: user.userId,
      coupon: cart.coupon ? cart.coupon : null
    });

    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          products: [],
          coupon: null,
          couponId: null,
          total: 0
        }
      }
    )
    if (cart.couponId) {
      await usedCouponsModel.findOneAndUpdate(
        { userId: user.userId },
        {
          userId: user.userId,
          $addToSet: {
            coupons: cart.couponId
          }
        },
        {
          upsert: true,
        }
      )
      await couponModel.findOneAndUpdate(
        { _id: cart.couponId },
        { $inc: { usageLimit: 1 } }
      )
    }

    res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    next(error)
  }
}

const orderUsingWalletController = async (req, res, next) => {
  const { addressId, isContinuePayment = false, orderId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    if (!mongoose.isObjectIdOrHexString(addressId)) {
      throw new CustomError("invalid address id", BAD_REQUEST)
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      throw new CustomError('Address not found', BAD_REQUEST);
    }

    let cart
    if (isContinuePayment) {
      if (!mongoose.isObjectIdOrHexString(orderId)) {
        throw new CustomError('invalid orderId', BAD_REQUEST)
      }
      cart = await orderModel.findOne({ _id: orderId })
    } else {
      cart = await cartModel.findOne({ userId: user.userId });
    }

    if (!cart || cart.products.length === 0) {
      throw new CustomError('Cart is empty', BAD_REQUEST);
    }

    // * decreasing stock
    for (const item of cart.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError('Product not found', BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for product: ${product.name}`, BAD_REQUEST);
      }
      product.stock -= item.quantity;
      await product.save();
    }

    const wallet = await walletModel.findOne({ userId: user.userId })
    if (cart.total > wallet.balance) {
      throw new CustomError('not enough balance in wallet', CONFLICT)
    }

    await walletModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: {
          transactions: {
            amount: cart.total,
            debit: true,
            credit: false,
          }
        },
        $inc: { balance: -cart.total }
      }
    )

    // * return here if payment continue
    if (isContinuePayment) {
      const newOrder = await orderModel.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            paymentMethod: 'wallet',
            paymentStatus: 'Completed',
          }
        },
        { new: true }
      )
      res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
      return
    }


    const newOrder = await orderModel.create({
      addressId: address._id,
      orderStatus: 'Pending',
      products: cart.products,
      originalTotal: cart.total,
      total: cart.total,
      paymentMethod: 'wallet',
      paymentStatus: 'Completed',
      userId: user.userId,
      coupon: cart.coupon ? cart.coupon : null
    });

    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          products: [],
          coupon: null,
          couponId: null,
          total: 0
        }
      }
    )
    if (cart.couponId) {
      await usedCouponsModel.findOneAndUpdate(
        { userId: user.userId },
        {
          userId: user.userId,
          $addToSet: {
            coupons: cart.couponId
          }
        },
        {
          upsert: true,
        }
      )
      await couponModel.findOneAndUpdate(
        { _id: cart.couponId },
        { $inc: { usageLimit: 1 } }
      )
    }

    res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    next(error)
  }
}


const orderUsingPaypalController = async (req, res, next) => {
  const { addressId, isContinuePayment = false, orderId } = req.body
  try {
    console.log(" addressId ", addressId)
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    if (!mongoose.isObjectIdOrHexString(addressId)) {
      throw new CustomError("invalid address id", BAD_REQUEST)
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      throw new CustomError('Address not found', BAD_REQUEST);
    }


    let cart
    if (isContinuePayment) {
      if (!mongoose.isObjectIdOrHexString(orderId)) {
        throw new CustomError('invalid order id', BAD_REQUEST)
      }
      cart = await orderModel.findOne({ _id: orderId })
    } else {
      cart = await cartModel.findOne({ userId: user.userId });
    }

    if (!cart || cart.products.length === 0) {
      throw new CustomError('Cart is empty', BAD_REQUEST);
    }

    const request = new paypal.orders.OrdersCreateRequest()
    let totalInUsd = await currencyConverter.convert(cart.total)
    totalInUsd = totalInUsd.toFixed(2)

    console.log("totalInUsd ", totalInUsd)

    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: totalInUsd,
            breakdown: {
              currency_code: 'IN',
              value: totalInUsd
            }
          }
        }
      ]
    })

    const order = await paypalClient.execute(request)
    console.log(order)
    res.status(OK).json({ id: order.result.id })
  } catch (error) {
    next(error)
  }
}


const orderSuccessPaypalController = async (req, res, next) => {
  const { paymentID, payerID, orderID, paymentSource, addressId, isContinuePayment = false, dbOrderId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    let cart
    if (isContinuePayment) {
      if (!mongoose.isObjectIdOrHexString(dbOrderId)) {
        throw new CustomError('invalid order id', BAD_REQUEST)
      }
      cart = await orderModel.findOne({ _id: dbOrderId })
    } else {
      cart = await cartModel.findOne({ userId: user.userId })
    }

    console.log(cart.products.length)

    if (!cart) {
      throw new CustomError('cart not found', NOT_FOUND)
    }

    // * decreasing stock
    for (const item of cart.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError('Product not found', BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for product: ${product.name}`, BAD_REQUEST);
      }
      product.stock -= item.quantity;
      console.log(product)
      await product.save();
    }
    console.log('two')

    if (isContinuePayment) {
      const newOrder = await orderModel.findOneAndUpdate(
        { _id: dbOrderId },
        { $set: { paymentStatus: 'Completed' } },
        { new: true }
      )
      await createLedgerBookTransaction({
        amount: newOrder.total,
        message: 'Product sold',
        type: 'Credit'
      })
      res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
      return
    }


    const newOrder = await orderModel.create({
      addressId: addressId,
      orderStatus: 'Pending',
      products: cart.products,
      originalTotal: cart.total,
      total: cart.total,
      paymentMethod: 'online',
      paymentStatus: 'Completed',
      userId: user.userId,
      coupon: cart?.coupon ? cart.coupon : null,
      paymentDetails: {
        paymentID,
        payerID,
        orderID,
        paymentSource,
      }
    });

    await createLedgerBookTransaction({
      amount: cart.total,
      message: 'Product sold',
      type: 'Credit'
    })



    console.log(cart.total)
    console.log(newOrder.total)

    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          products: [],
          coupon: null,
          couponId: null,
          total: 0
        }
      }
    )
    if (cart.couponId) {
      console.log('cart.couponId ', cart.couponId)
      await usedCouponsModel.findOneAndUpdate(
        { userId: user.userId },
        {
          userId: user.userId,
          $addToSet: {
            coupons: cart.couponId
          }
        },
        { upsert: true, }
      )

      await couponModel.findOneAndUpdate(
        { _id: cart.couponId },
        { $inc: { usageLimit: 1 } }
      )
    }

    res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    next(error)
  }
}

const orderFailedPaypalController = async (req, res, next) => {
  const { addressId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const cart = await cartModel.findOne({ userId: user.userId })
    console.log(cart.products.length)

    if (!cart) {
      throw new CustomError('cart not found', NOT_FOUND)
    }

    // * decreasing stock
    for (const item of cart.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError('Product not found', BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for product: ${product.name}`, BAD_REQUEST);
      }
      product.stock -= item.quantity;
      console.log(product)
      await product.save();
    }

    const newOrder = await orderModel.create({
      addressId: addressId,
      orderStatus: 'Pending',
      products: cart.products,
      total: cart.total,
      paymentMethod: 'online',
      paymentStatus: 'Failed',
      userId: user.userId,
      coupon: cart?.coupon ? cart.coupon : null,
      paymentDetails: {
        paymentSource: 'paypal',
      }
    });

    console.log(cart.total)
    console.log(newOrder.total)

    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          products: [],
          coupon: null,
          couponId: null,
          total: 0
        }
      }
    )
    if (cart.couponId) {
      console.log('cart.couponId ', cart.couponId)
      await usedCouponsModel.findOneAndUpdate(
        { userId: user.userId },
        {
          userId: user.userId,
          $addToSet: {
            coupons: cart.couponId
          }
        },
        { upsert: true, }
      )

      await couponModel.findOneAndUpdate(
        { _id: cart.couponId },
        { $inc: { usageLimit: 1 } }
      )
    }

    res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    next(error)
  }
}


const getPaymentFailedPageController = async (req, res, next) => {
  try {
    res.render('user/cart/paymentFailed', { ...viewPageNotFound, backToAdmin: true })
  } catch (error) {
    next(error)
  }
}

const getPaymentSuccessPageController = async (req, res, next) => {
  try {
    res.render('user/cart/paymentSuccess', { ...viewPageNotFound, backToAdmin: true })
  } catch (error) {
    next(error)
  }
}

const cancelOrderController = async (req, res, next) => {
  const { orderId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)

    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError("invalid orderId", BAD_REQUEST)
    }
    const order = await orderModel.findOne({ _id: orderId })
    if (order.orderStatus === orderStatusValues.Delivered) {
      throw new CustomError("cannot cancel delivered order", BAD_REQUEST)
    }
    if (order.orderStatus === orderStatusValues.Cancelled) {
      throw new CustomError("order already cancelled", CONFLICT)
    }

    let paymentStatus = paymentStatusValues.Failed
    let orderStatus = orderStatusValues.Cancelled
    if (order.orderStatus === orderStatusValues.ReturnRequested) {
      paymentStatus = paymentStatusValues.Completed
      orderStatus = orderStatusValues.Delivered
    }
    console.log("paymentStatus ", paymentStatus)

    if (!validateOrderStatusTransactions[order.orderStatus].includes(orderStatusValues.Cancelled)) {
      throw new CustomError('already cancelled or returned', BAD_REQUEST)
    }

    // * increasing stock
    const cancelledOrder = await cancelOrReturnWholeOrder({
      userId: user.userId,
      orderId,
      order: order,
      orderStatus: orderStatusValues.Cancelled,
      paymentStatus,
    })

    if (order.paymentStatus === 'Completed') {
      await createLedgerBookTransaction({
        amount: order.total,
        message: 'order returned',
        type: "Debit",
      })
    }



    // console.log(cancelledOrder)
    res.status(OK).json({ message: "order cancelled", order: cancelledOrder })
  } catch (error) {
    next(error)
  }
}


const returnOrderController = async (req, res, next) => {
  const { orderId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError("invalid orderId", BAD_REQUEST)
    }
    const order = await orderModel.findOne({ _id: orderId })
    if (order.orderStatus !== orderStatusValues.Delivered) {
      throw new CustomError("cannot return the order thats not delivered", BAD_REQUEST)
    }

    if (!validateOrderStatusTransactions[order.orderStatus].includes(orderStatusValues.ReturnRequested)) {
      throw new CustomError('already cancelled or returned', BAD_REQUEST)
    }

    const cancelledOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: 'Return Requested' } },
      { new: true }
    )
    res.status(OK).json({ message: "order return request", order: cancelledOrder })
  } catch (error) {
    next(error)
  }
}


// * single order 
const cancelSingleOrderOrderController = async (req, res, next) => {
  let { orderId, productId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)

    const order = await orderModel.findOneAndUpdate(
      { _id: orderId, 'products.productId': productId },
      { $set: { 'products.$.orderStatus': 'Cancelled' } },
      { new: true }
    )
    if (!order) {
      throw new CustomError('no order found', NOT_FOUND)
    }

    let count = 0
    let length = order.products.length
    const orderProductDetails = order.products.filter((product) => {
      if (product.orderStatus === 'Cancelled') {
        count++
      }
      return product.productId.toString() === productId;
    })

    if (count === length) {
      throw new CustomError('all orders cancelled', GONE)
    }

    // * total calculation
    const deliveryFee = 10
    let orderActualTotal = 0
    orderActualTotal += deliveryFee
    order.products.map((product) => {
      if (product.orderStatus !== orderStatusValues.Cancelled) {
        orderActualTotal += product.price
      }
    })

    console.log('orderActualTotal = ', orderActualTotal)
    let orderTotal = 0
    if (order.coupon) {
      const coupon = await couponModel.findOne({ code: order.coupon })
      if (coupon.discountType === 'percentage') {
        const discountAmount = (orderActualTotal * coupon.discountValue) / 100;
        orderTotal = orderActualTotal > (coupon.minCartAmount)
          ? orderActualTotal - discountAmount
          : orderActualTotal

      } else {
        orderTotal = orderActualTotal >= (coupon.discountValue * 2)
          ? orderActualTotal - coupon.discountValue
          : orderActualTotal
      }
    } else {
      orderTotal = orderActualTotal
    }

    console.log(orderProductDetails)
    console.log("orderTotal =  ", orderTotal)

    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: productId },
      { $inc: { stock: orderProductDetails?.[0].quantity } },
      { new: true }
    )

    if (order.paymentMethod !== 'cod') {
      const updatedWallet = await walletModel.findOneAndUpdate(
        { userId: user.userId },
        {
          $inc: { balance: orderProductDetails?.[0].price },
          $push: {
            transactions: {
              amount: orderProductDetails?.[0].price,
              credit: true,
              debit: false,
            }
          }
        },
      )
      console.log('wallet updated')
    }

    const updateOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: { total: orderTotal } },
      { new: true }
    )

    res.status(OK).json({ message: 'single product cancelled', order: updateOrder })
  } catch (error) {
    next(error)
  }
}

const returnSingleOrderOrderController = async (req, res, next) => {
  const { orderId, productId } = req.body
  try {
    const order = await orderModel.findOneAndUpdate(
      { _id: orderId, 'products.productId': productId },
      { $set: { 'products.$.orderStatus': 'Return Requested' } },
      { new: true }
    )
    if (!order) {
      throw new CustomError('order not found', BAD_REQUEST)
    }
    if (order.orderStatus !== 'Delivered') {
      throw new CustomError('already returned', BAD_REQUEST)
    }

    let count = 0
    let length = order.products.length
    const orderProductDetails = order.products.filter((product) => {
      if (
        product.orderStatus === 'Cancelled'
        || product.orderStatus === 'Return Requested'
        || product.orderStatus === 'Return Approved'
        || product.orderStatus === 'Returned'
      ) {
        count++
      }
      return product.productId.toString() === productId;
    })

    if (count === length) {
      throw new CustomError('all orders returned', GONE)
    }

    res.status(OK).json({ message: 'single product cancelled', order: order })
  } catch (error) {
    next(error)
  }
}
// * single order  end




module.exports = {
  getAllOrdersPageController,
  getOrderDetailsPageController,

  orderUsingCodController,
  orderUsingWalletController,
  orderUsingPaypalController,
  orderSuccessPaypalController,
  orderFailedPaypalController,
  getPaymentFailedPageController,
  getPaymentSuccessPageController,

  cancelOrderController,
  returnOrderController,

  cancelSingleOrderOrderController,
  returnSingleOrderOrderController
}