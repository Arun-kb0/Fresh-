const { sessionCookieMaxAge } = require("../../config/sessionConfig")
const CustomError = require("../../constants/CustomError")
const { OK, NOT_FOUND, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage, viewPageNotFound } = require("../../constants/pageConfid")
const addressModel = require("../../model/addressModel")
const productModel = require("../../model/productModel")
const userModel = require("../../model/userModel")
const bcrypt = require('bcrypt')
const orderModel = require('../../model/orderModel')
const mongoose = require("mongoose")
const couponModel = require("../../model/couponModel")
const usedCouponsModel = require("../../model/usedCouponsModel")
const { getProductsAggregation, getOrderDetailsAggregation } = require("../../helpers/aggregationPipelines")
const walletModel = require("../../model/walletModel")
const htmlToPdf = require('html-pdf-node')
const ejs = require('ejs')
const path = require('path')


const getProfileController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    const userId = req?.cookies?.user
      ? JSON.parse(req.cookies.user).userId
      : ''
    const products = await getProductsAggregation({
      sort: { rating: 1, name: 1 },
      skip: startIndex,
      limit: LIMIT,
      userId
    })

    const wallet = await walletModel.findOne({ userId })
    const user = await userModel.findOne({ userId })

    res.render('user/profile/profile', {
      ...viewUsersPage,
      user,
      walletBalanceAmount: wallet?.balance ? wallet.balance : 0,
      suggestions: products ? products : []
    })
  } catch (error) {
    next(error)
  }
}

// * edit profile
const getUserDetailsPageController = async (req, res, next) => {
  try {
    const cookieUser = JSON.parse(req.cookies?.user)
    const user = await userModel.findOne({ userId: cookieUser.userId })
    res.render('user/profile/editUser', { ...viewUsersPage, user: user })
  } catch (error) {
    next(error)
  }
}

const getUserDetailsController = async (req, res, next) => {
  try {
    const cookieUser = JSON.parse(req.cookies?.user)
    const user = await userModel.findOne({ userId: cookieUser.userId })
    res.status(OK).json({ message: "get user details success", user: user })
  } catch (error) {
    next(error)
  }
}

const editUserController = async (req, res, next) => {
  const { userId, name, username, password } = req.body
  try {
    let updateField = {}
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
      updateField.password = hashedPassword
    }
    if (name) updateField.name = name
    if (username) updateField.username = username

    const editedUser = await userModel.findOneAndUpdate(
      { userId },
      { ...updateField },
      { new: true }
    )

    const sessionUser = {
      userId: editedUser.userId,
      name: editedUser.name,
      username: editedUser.username,
      isAdmin: false,
      provider: null
    }
    res.cookie(
      'user',
      JSON.stringify(sessionUser),
      { maxAge: sessionCookieMaxAge }
    )

    res.status(OK).json({ message: "edit user success", user: editedUser })
  } catch (error) {
    next(error)
  }
}


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


const getCouponsPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const isUsedCoupons = await usedCouponsModel.findOne({ userId: user.userId })
    if (!isUsedCoupons) {
      await usedCouponsModel.create({
        userId: user.userId,
        coupons:[]
      })
    }
    const result = await usedCouponsModel.aggregate([
      {
        $match: {
          userId: user.userId
        }
      },
      {
        $lookup: {
          from: "coupons",
          let: {
            usedCouponIds: "$coupons"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $not: {
                    $in: ["$_id", "$$usedCouponIds"]
                  }
                },
                isDeleted: false
              }
            },
            {
              $sort: {
                startDate: -1
              }
            }
          ],
          as: "unusedCoupons"
        }
      }
    ]
)

    res.render('user/profile/coupons', {
      ...viewUsersPage,
      coupons: (result && result.length !== 0)  
        ? result[0].unusedCoupons
        : []
    })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getProfileController,
  

  editUserController,
  getUserDetailsController,
  getUserDetailsPageController,

  getAllOrdersPageController,
  getOrderDetailsPageController,
  getCouponsPageController
}