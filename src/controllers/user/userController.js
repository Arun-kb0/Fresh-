const { sessionCookieMaxAge } = require("../../config/sessionConfig")
const CustomError = require("../../constants/CustomError")
const { OK, NOT_FOUND, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const userModel = require("../../model/userModel")
const bcrypt = require('bcrypt')
const couponModel = require("../../model/couponModel")
const productModel = require("../../model/productModel")
const { getProductsAggregation } = require("../../helpers/aggregationPipelines")
const walletModel = require("../../model/walletModel")



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


module.exports = {
  getProfileController,
  editUserController,
  getUserDetailsController,
  getUserDetailsPageController,
}