const CustomError = require("../../constants/CustomError")
const { OK, NOT_FOUND, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage, viewPageNotFound } = require("../../constants/pageConfid")
const orderModel = require('../../model/orderModel')
const mongoose = require("mongoose")
const { getOrderDetailsAggregation } = require("../../helpers/aggregationPipelines")
const htmlToPdf = require('html-pdf-node')
const ejs = require('ejs')
const path = require('path')



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


module.exports = {
  getAllOrdersPageController,
  getOrderDetailsPageController,
}