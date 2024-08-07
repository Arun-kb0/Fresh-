
const CustomError = require("../../constants/CustomError")
const { OK, BAD_REQUEST, NOT_FOUND, GONE, CONFLICT } = require("../../constants/httpStatusCodes")
const { viewAdminPage, viewPageNotFound } = require("../../constants/pageConfid")
const { validateOrderStatusTransactions, orderStatusValues, paymentStatusValues, validatePaymentTransactions } = require("../../constants/statusValues")
const { getOrderDetailsAggregation } = require("../../helpers/aggregationPipelines")
const orderModel = require("../../model/orderModel")
const mongoose = require('mongoose')
const productModel = require("../../model/productModel")
const walletModel = require("../../model/walletModel")
const couponModel = require("../../model/couponModel")
const { getOrderTotal, cancelOrReturnWholeOrder } = require("../../helpers/orderHelpers")
const { createLedgerBookTransaction } = require("../../helpers/ledgerBookHelpers")


const getAllOrdersAdminPageController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await orderModel.countDocuments()
    const numberOfPages = Math.ceil(total / LIMIT)

    const orderDetails = await orderModel.aggregate([
      {
        $lookup: {
          from: 'addresses',
          localField: 'addressId',
          foreignField: '_id',
          as: 'addressDetails'
        }
      },
      {
        $unwind: '$addressDetails'
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
          'products.image': { $arrayElemAt: ['$productDetails.image', 0] },
          'products.finalPrice': { $arrayElemAt: ['$productDetails.finalPrice', 0] },
          "products.soldBy": { $arrayElemAt: ["$productDetails.productInfo.soldBy", 0] }
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
          addressDetails: { $first: '$addressDetails' }, // Include full address details
          orderStatus: { $first: '$orderStatus' },
          total: { $first: '$total' },
          paymentMethod: { $first: '$paymentMethod' },
          coupon: { $first: '$coupon' },
          paymentStatus: { $first: '$paymentStatus' },
          products: { $push: '$products' },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: LIMIT }
    ]);

    res.render('admin/order/ordersTable', {
      ...viewAdminPage,
      orders: orderDetails,
      page: Number(page),
      numberOfPages,
    })
  } catch (error) {
    next(error)
  }
}

const changeOrderStatusController = async (req, res, next) => {
  const { status, orderId, noCheck = false } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError('invalid orderId', BAD_REQUEST)
    }
    const currentOrder = await orderModel.findOne({ _id: orderId })
    if (!currentOrder) {
      throw new CustomError('order not found', NOT_FOUND)
    }
    const userId = currentOrder.userId

    // * status values
    if (!noCheck && !validateOrderStatusTransactions[currentOrder.orderStatus].includes(status)) {
      throw new CustomError('invalid status update', BAD_REQUEST)
    }

    let paymentStatus = currentOrder.paymentStatus
    if (status === orderStatusValues.Delivered) {
      paymentStatus = paymentStatusValues.Completed
    } else if (status === orderStatusValues.ReturnApproved) {
      paymentStatus = paymentStatusValues.Refunded
    } else if (status === orderStatusValues.Cancelled) {
      paymentStatus = paymentStatusValues.Failed
    }

    

    if (currentOrder.paymentMethod === 'cod'
      && status === orderStatusValues.Delivered
      && paymentStatus === 'Completed') {
      await createLedgerBookTransaction({
        amount: currentOrder.total,
        message: 'Product sold',
        type: 'Credit'
      })
    } else if (status === orderStatusValues.Returned && paymentStatus === 'Refunded') {
      await createLedgerBookTransaction({
        amount: currentOrder.total,
        type:'Debit',
        message: `order ${status}`,
      })

    }

    const filteredProductIds = currentOrder.products
      .filter((product) => {
        console.log(product.orderStatus, " ", status);
        return validateOrderStatusTransactions[product.orderStatus].includes(status);
      })
      .map(product => product.productId.toString());

    console.log("filteredProductIds ")
    console.log(filteredProductIds)

    // * getOrder total , increase stock and refund money
    const updatedOrder = await cancelOrReturnWholeOrder({
      userId: currentOrder.userId,
      orderId,
      order: currentOrder,
      orderStatus: status,
      paymentStatus,
      noCheck: noCheck
    })
    // console.log(updatedOrder)



    const lastUpdatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: { "products.$[elem].orderStatus": status } },
      {
        arrayFilters: [{ "elem.productId": { $in: filteredProductIds } }]
      }
    )

    res.status(OK).json({ message: "status changed", order: updatedOrder })
  } catch (error) {
    next(error)
  }
}

const changePaymentStatusController = async (req, res, next) => {
  const { status, orderId } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError('invalid orderId', BAD_REQUEST)
    }
    const currentOrder = await orderModel.findOne({ _id: orderId })
    if (!currentOrder) {
      throw new CustomError('order not found ', NOT_FOUND)
    }
    if (!validatePaymentTransactions[currentOrder.paymentStatus].includes(status)) {
      throw new CustomError('invalid status ', BAD_REQUEST)
    }

    let orderStatus = currentOrder.orderStatus
    if (status === paymentStatusValues.Failed) {
      orderStatus = orderStatusValues.Cancelled
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          paymentStatus: status,
          orderStatus
        }
      }
    )
    res.status(OK).json({ message: "status changed", order: updatedOrder })
  } catch (error) {
    next(error)
  }
}

const getOrderDetailsAdminPageController = async (req, res, next) => {
  let { orderId } = await req.query
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      console.log('invalid order id')
      res.render('user/notfound/notFound', { ...viewPageNotFound, backToAdmin: true })
      return
    }

    orderId = mongoose.Types.ObjectId.createFromHexString(orderId)
    const orderDetails = await getOrderDetailsAggregation({ orderId })

    res.render('admin/order/orderDetailsAdmin', {
      ...viewAdminPage,
      order: orderDetails
    })
  } catch (error) {
    next(error)
  }
}

const singleOrderStatusChangeController = async (req, res, next) => {
  const { productId, orderId, status } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(productId)
      || !mongoose.isObjectIdOrHexString(orderId)
    ) {
      throw new CustomError('invalid productId or orderId', BAD_REQUEST)
    }

    const order = await orderModel.findOne({ _id: orderId })

    let count = 0
    let length = order.products.length
    const orderProductDetails = order.products.filter((product) => {
      if (
        product.orderStatus === 'Cancelled'
        || product.orderStatus === 'Returned Requested'
        || product.orderStatus === 'Return Approved'
        || product.orderStatus === 'Returned'
      ) {
        count++
      }
      return product.productId.toString() === productId;
    })

    console.log("count , length", count, length)
    if (count === length) {
      throw new CustomError('all orders in process of return or cancelled', GONE)
    }


    if (!validateOrderStatusTransactions[orderProductDetails?.[0]?.orderStatus].includes(status)) {
      throw new CustomError('invalid order status', CONFLICT)
    }


    console.log('products length ', order.products.length)
    // * total calculation
    const deliveryFee = 10
    let orderActualTotal = 0
    orderActualTotal += deliveryFee
    order.products.map((product) => {
      if (product.orderStatus === 'Cancelled'
        || product.orderStatus === 'Returned'
        || product.orderStatus === 'Return Approved'
      ) {

      } else {
        orderActualTotal += product.price
      }
    })

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
    // console.log(orderProductDetails)
    console.log('orderActualTotal = ', orderActualTotal)
    console.log("orderTotal =  ", orderTotal)


    console.log("status code")
    console.log(orderProductDetails?.[0]?.orderStatus)
    console.log(order.paymentStatus)
    // * payment return
    let updatedOrder
    if (order.paymentStatus === 'Completed'
      && orderProductDetails?.[0]?.orderStatus === 'Return Approved'
    ) {

      // * increasing product quantity
      const updatedProduct = await productModel.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: orderProductDetails?.[0].quantity } },
        { new: true }
      )

      updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId, "products.productId": productId },
        {
          $set: {
            total: orderTotal,
            'products.$.orderStatus': status,
          }
        },
        { new: true }
      )

      const updatedWallet = await walletModel.findOneAndUpdate(
        { userId: order.userId },
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
    } else {
      updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId, "products.productId": productId },
        { $set: { 'products.$.orderStatus': status, } },
        { new: true }
      )
    }



    res.status(OK).json({ message: `order status changed to ${status}` })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllOrdersAdminPageController,
  changeOrderStatusController,
  changePaymentStatusController,
  getOrderDetailsAdminPageController,
  singleOrderStatusChangeController
}