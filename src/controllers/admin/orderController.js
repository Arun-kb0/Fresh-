
const CustomError = require("../../constants/CustomError")
const { OK, BAD_REQUEST, NOT_FOUND } = require("../../constants/httpStatusCodes")
const { viewAdminPage } = require("../../constants/pageConfid")
const { validateOrderStatusTransactions, orderStatusValues, paymentStatusValues, validatePaymentTransactions } = require("../../constants/statusValues")
const { getOrderDetailsAggregation } = require("../../helpers/aggregationPipelines")
const orderModel = require("../../model/orderModel")
const mongoose = require('mongoose')


const getAllOrdersAdminPageController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 4
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

    // res.status(OK).json({
    //   orders: orderDetails,
    //   page: Number(page),
    //   numberOfPages,
    // })

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
  const { status, orderId } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError('invalid orderId', BAD_REQUEST)
    }
    const currentOrder = await orderModel.findOne({ _id: orderId })
    if (!currentOrder) {
      throw new CustomError('order not found', NOT_FOUND)
    }
    // * status values
    if (!validateOrderStatusTransactions[currentOrder.orderStatus].includes(status)) {
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

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus: status,
          paymentStatus,
          "products.$[].orderStatus": status
        },
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

const cancelSingleOrderController = async (req, res, next) => {
  const { productId } = req.body
  try {
      
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllOrdersAdminPageController,
  changeOrderStatusController,
  changePaymentStatusController,
  getOrderDetailsAdminPageController,
  cancelSingleOrderController
}