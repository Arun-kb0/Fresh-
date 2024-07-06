
const CustomError = require("../../constants/CustomError")
const { OK, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewAdminPage } = require("../../constants/pageConfid")
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
  const {status, orderId} = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError('invalid orderId', BAD_REQUEST)
    }
    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus: status,
        }
      }
    )
    res.status(OK).json({message:"status changed" , order: updatedOrder })
  } catch (error) {
    next(error)
  }
}

const changePaymentStatusController = async (req, res, next) => {
  const {status, orderId} = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError('invalid orderId', BAD_REQUEST)
    }
    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          paymentStatus: status,
        }
      }
    )
    res.status(OK).json({message:"status changed" , order: updatedOrder })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAllOrdersAdminPageController,
  changeOrderStatusController,
  changePaymentStatusController,
}