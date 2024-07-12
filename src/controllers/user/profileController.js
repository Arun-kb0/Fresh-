const { sessionCookieMaxAge } = require("../../config/sessionConfig")
const CustomError = require("../../constants/CustomError")
const { OK, NOT_FOUND, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const addressModel = require("../../model/addressModel")
const productModel = require("../../model/productModel")
const userModel = require("../../model/userModel")
const bcrypt = require('bcrypt')
const orderModel = require('../../model/orderModel')
const mongoose = require("mongoose")
const { find } = require("../../model/cartModel")
const couponModel = require("../../model/couponModel")
const usedCouponsModel = require("../../model/usedCouponsModel")


const getProfileController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    const products = await productModel.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "categoryId",
          foreignField: "_id",
          as: "subcategory"
        }
      },
      {
        $addFields: {
          subcategory: {
            $filter: {
              input: "$subcategory",
              as: "category",
              cond: {
                $eq: ["$$category.isDeleted", false]
              }
            }
          }
        }
      },
      {
        $unwind: {
          path: "$subcategory",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: {
          rating: 1,
          name: 1
        }
      },
      {
        $skip: startIndex
      },
      {
        $limit: LIMIT
      }
    ])
    res.render('user/profile/profile', { ...viewUsersPage, suggestions: products })
  } catch (error) {
    next(error)
  }
}

const getAddressController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const address = await addressModel.find({ userId: user.userId })
    if (!address) {
      throw new CustomError('no address for user', NOT_FOUND)
    }
    // res.status(OK).json({ address: address })
    res.render('user/profile/address', { ...viewUsersPage, address })
  } catch (error) {
    next(error)
  }
}

const createAddressController = async (req, res, next) => {
  const address = req.body
  try {

    const user = JSON.parse(req.cookies.user)
    const newAddress = await addressModel.create({
      userId: user.userId,
      ...address
    })

    res.status(OK).json({ message: "new address added", address: newAddress })
  } catch (error) {
    next(error)
  }
}

const editAddressController = async (req, res, next) => {
  const { addressId, ...address } = req.body
  try {
    // console.log(addressId)
    if (!addressId) {
      throw new CustomError("invalid id ", BAD_REQUEST)
    }
    const updatedAddress = await addressModel.findOneAndUpdate(
      { _id: addressId },
      { ...address },
      { new: true }
    )
    if (!updatedAddress) {
      throw new CustomError("address not found ", NOT_FOUND)
    }

    res.status(OK).json({ message: "address updated", address: updatedAddress })
  } catch (error) {
    next(error)
  }
}

const deleteAddressController = async (req, res, next) => {
  const { addressId } = req.query
  try {
    const result = await addressModel.deleteOne({ _id: addressId })
    if (result.deletedCount === 0) {
      throw new CustomError('already deleted', NOT_FOUND)
    }
    res.status(OK).json({ message: "address deleted" })
  } catch (error) {
    next(error)
  }
}

const getSingleAddressController = async (req, res, next) => {
  const { addressId } = req.query
  try {
    console.log(addressId)
    const address = await addressModel.findOne({ _id: addressId })
    if (!address) {
      throw new CustomError("address not found", NOT_FOUND)
    }
    res.status(OK).json({ message: "get single order success", address })
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
  try {
    const user = JSON.parse(req.cookies.user)
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
      {
        $sort: { createdAt: -1 }
      }
    ])

    // res.status(OK).json({ orders:ordersWithProducts[0] })
    res.render('user/profile/orders', { orders: ordersWithProducts, ...viewUsersPage })
  } catch (error) {
    next(error)
  }
}

const getOrderDetailsPageController = async (req, res, next) => {
  let { orderId } = req.query
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError('invalid orderId', BAD_REQUEST)
    }

    orderId = mongoose.Types.ObjectId.createFromHexString(orderId)

    const orderDetails = await orderModel.aggregate([
      {
        $match: {
          _id: orderId
        }
      },
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
          from: 'products', // Collection name of products
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
      }
    ]);

    // res.status(OK).json({ order: orderDetails[0] })
    res.render('user/profile/orderDetails', { ...viewUsersPage, order: orderDetails[0] })
  } catch (error) {
    next(error)
  }
}


const getCouponsPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
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
            }
          ],
          as: "unusedCoupons"
        }
      }
    ])

    res.render('user/profile/coupons', { ...viewUsersPage, coupons: result[0].unusedCoupons })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getProfileController,
  getAddressController,
  createAddressController,
  editAddressController,
  deleteAddressController,
  getSingleAddressController,

  editUserController,
  getUserDetailsController,
  getUserDetailsPageController,

  getAllOrdersPageController,
  getOrderDetailsPageController,
  getCouponsPageController
}