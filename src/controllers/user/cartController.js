const { OK, BAD_REQUEST, NOT_FOUND, CREATED, CONFLICT, GONE } = require("../../constants/httpStatusCodes")
const { viewUsersPage, viewPageNotFound } = require("../../constants/pageConfid")
const cartModel = require("../../model/cartModel")
const productModel = require("../../model/productModel")
const CustomError = require('../../constants/CustomError')
const mongoose = require('mongoose')
const addressModel = require("../../model/addressModel")
const orderModel = require("../../model/orderModel")
const couponModel = require("../../model/couponModel")
const usedCouponsModel = require("../../model/usedCouponsModel")
const paypal = require('@paypal/checkout-server-sdk')
const CC = require('currency-converter-lt')
const { validateOrderStatusTransactions, orderStatusValues, paymentStatusValues } = require('../../constants/statusValues')
const walletModel = require("../../model/walletModel")
const { getCartWithDetailsAggregation, cartCheckoutAggregation } = require("../../helpers/aggregationPipelines")
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

// * helperFunctions


const getCartTotal = ({ cart, deliveryFee = 10 }) => {
  const total = cart.products.reduce((acc, item) => (acc + item.price), 0)
  return total + deliveryFee
}

const calculateDiscount = ({ total, coupon }) => {
  let finalTotal = 0
  if (coupon?.discountType === 'percentage') {
    const discount = (total * coupon.discountValue) / 100;
    finalTotal = total - discount;
  } else if (coupon.discountType === 'amount') {
    finalTotal = total - coupon.discountValue
  }
  return finalTotal
}




// * helper functions end


const getCartPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    const cart = await cartModel.findOne({ userId: user.userId })
    if (!cart) {
      res.render('user/cart/cart', {
        ...viewUsersPage,
        cart: null
      })
      return
    }

    let total = 0
    if (cart?.coupon) {
      const coupon = await couponModel.findOne({ _id: cart.couponId })
      let cartTotal = getCartTotal({ cart, deliveryFee })
      total = calculateDiscount({ total: cartTotal, coupon })
    } else {
      total = getCartTotal({ cart, deliveryFee })
    }
    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      { $set: { total } }
    )
    console.log("total ", total)
    const cartWithDetails = await getCartWithDetailsAggregation({ userId: user.userId, deliveryFee })

    res.render('user/cart/cart', {
      ...viewUsersPage,
      cart: cartWithDetails
    })
  } catch (error) {
    next(error)
  }
}


const addToCartController = async (req, res, next) => {
  const { productId, quantity = 1 } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const userId = user.userId
    if (!mongoose.isObjectIdOrHexString(productId)) {
      throw new CustomError('invalid productId', BAD_REQUEST)
    }
    const product = await productModel.findById(productId)
    if (!product) {
      return res.status(BAD_REQUEST).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(NOT_FOUND).json({ message: "Not enough stock" });
    }

    const isCartExists = await cartModel.findOne({userId})
    


    let updatedCart
    if (isCartExists) {
      const cart = await cartModel.findOne({ userId: userId, 'products.productId': productId });
      const pricePerQuantity = product.finalPrice * quantity
      if (cart) {
        updatedCart = await cartModel.findOneAndUpdate(
          { userId: userId, 'products.productId': productId },
          {
            $inc: {
              'products.$.quantity': quantity,
              'products.$.price': pricePerQuantity,
            },
          },
          { new: true }
        ).populate('products.productId', 'image productInfo.soldBy stock');
  
      } else {
          //*  If the product does not exist, add it to the cart
          updatedCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            {
              $set: {
                userId: userId,
              },
              $addToSet: {
                products: {
                  productId: product._id,
                  quantity: quantity,
                  price: product.finalPrice
                },
              }
            },
            { new: true }
          ).populate('products.productId', 'image productInfo.soldBy stock');
        }
    } else {
      //*  If cart does not exist, add it to the cart
      updatedCart = await cartModel.create({
        userId: userId,
        products: [{
          productId: product._id,
          quantity: quantity,
          price: product.finalPrice * quantity,
        }]
      })
    }
    res.status(OK).json({ message: "item added", product })
  } catch (error) {
    next(error)
  }
}

const updateQuantityController = async (req, res, next) => {
  const { productId, quantity } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const userId = user.userId
    const product = await productModel.findById(productId).select('stock finalPrice image productInfo.soldBy');
    if (!product) {
      throw new CustomError('Product not found', BAD_REQUEST)
    }

    if (product.stock < quantity) {
      throw new CustomError('Not enough stock', NOT_FOUND)
    }

    const cart = await cartModel.findOne({ userId: userId, 'products.productId': productId });
    if (!cart) {
      throw new CustomError('cart does not exists', NOT_FOUND)
    }

    const pricePerQuantity = product.finalPrice * quantity
    let updatedCart
    updatedCart = await cartModel.findOneAndUpdate(
      { userId: userId, 'products.productId': productId },
      {
        $set: {
          'products.$.quantity': quantity,
          'products.$.price': pricePerQuantity
        }
      },
      { new: true }
    ).populate('products.productId', 'image productInfo.soldBy stock');

    res.status(OK).json({ message: "quantity updated", cart: updatedCart })
  } catch (error) {
    next(error)
  }
}

const deleteItemFromCartController = async (req, res, next) => {
  const { productId } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(productId)) {
      throw new CustomError('invalid productId', BAD_REQUEST)
    }
    const user = JSON.parse(req.cookies.user)
    updatedCart = await cartModel.findOneAndUpdate(
      { userId: user.userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    ).populate('products.productId', 'image productInfo.soldBy stock');

    res.status(OK).json({ message: "item deleted from cart", cart: updatedCart })
  } catch (error) {
    next(error)
  }
}


const getCheckoutPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    const cart = await cartModel.findOne({ userId: user.userId })
    let total = 0
    if (cart?.coupon) {
      const coupon = await couponModel.findOne({ _id: cart.couponId, isDeleted: false })
      let cartTotal = getCartTotal({ cart, deliveryFee })
      total = calculateDiscount({ total: cartTotal, coupon })
    } else {
      total = getCartTotal({ cart, deliveryFee })
    }
    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      { $set: { total } }
    )

    const cartWithDetails = await cartCheckoutAggregation({ userId: user.userId })


    console.log(cartWithDetails.appliedCouponDetails);
    // res.status(OK).json({ message: "get checkout success", checkOutCart: cartWithDetails[0] })
    res.render('user/cart/checkout', {
      ...viewUsersPage,
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
      checkoutCart: cartWithDetails,
      appliedCouponDetails: cartWithDetails.appliedCouponDetails ? cartWithDetails.appliedCouponDetails : null
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
      throw new CustomError('not enough balance in wallet',CONFLICT)
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



const applyCouponController = async (req, res, next) => {
  const { code } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const coupon = await couponModel.findOne({ code, isDeleted: false })
    if (!coupon) {
      throw new CustomError('invalid coupon code', BAD_REQUEST)
    }
    const currentDate = new Date()
    if (coupon.endDate < currentDate) {
      throw new CustomError('coupon expired', GONE)
    }

    const cart = await cartModel.findOne({ userId: user.userId })
    let total = getCartTotal({ cart })
    let finalTotal = calculateDiscount({ total, coupon })

    if (cart.coupon) {
      throw new CustomError('coupon already added remove to add another', CONFLICT)
    }
    if (total < coupon.minCartAmount) {
      throw new CustomError(`₹${coupon.minCartAmount} is required to apply this coupon`, BAD_REQUEST)
    }
    if (total > coupon?.maxCartAmount) {
      throw new CustomError(`₹${coupon.maxCartAmount} is max limit of this coupon`, BAD_REQUEST)
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new CustomError('coupon limit exceeded', GONE)
    }


    const usedCoupons = await usedCouponsModel.findOne({
      userId: user.userId,
      coupons: { $elemMatch: { $eq: coupon._id } }
    })
    console.log("coupon code ")
    console.log(coupon._id)
    console.log(usedCoupons)

    if (usedCoupons) {
      throw new CustomError('coupon already used', CONFLICT)
    }


    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          coupon: coupon.code,
          couponId: coupon._id,
          total: finalTotal,
        }
      },
      { new: true }
    )

    const updatedUsedCoupons = await usedCouponsModel.findOneAndUpdate(
      { userId: user.userId },
      { $push: { coupons: coupon._id } },
      { new: true }
    )

    res.status(OK).json({ message: 'coupon applied', coupon, finalTotal })
  } catch (error) {
    next(error)
  }
}

const removeCouponController = async (req, res, next) => {
  const { couponId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    if (!mongoose.isObjectIdOrHexString(couponId)) {
      throw new CustomError('invalid couponId', BAD_REQUEST)
    }
    const cart = await cartModel.findOne({ userId: user.userId })
    const usedCoupons = await usedCouponsModel.findOneAndUpdate(
      { userId: user.userId },
      { $pull: { coupons: couponId } },
      { new: true }
    )

    let total = getCartTotal({ cart })
    const updatedCart = await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          coupon: null,
          couponId: null,
          total: total.toFixed(2)
        }
      },
      { new: true }
    )

    res.status(OK).json({
      message: 'coupon removed ',
      cart: updatedCart
    })
  } catch (error) {
    next(error)
  }
}








module.exports = {
  getCartPageController,
  addToCartController,
  updateQuantityController,
  deleteItemFromCartController,
  getCheckoutPageController,

  orderUsingCodController,
  orderUsingWalletController,
  orderUsingPaypalController,
  orderSuccessPaypalController,
  orderFailedPaypalController,
  getPaymentFailedPageController,
  getPaymentSuccessPageController,

  cancelOrderController,
  returnOrderController,

  applyCouponController,
  removeCouponController,

  cancelSingleOrderOrderController,
  returnSingleOrderOrderController
}