const bcrypt = require('bcrypt')
const adminModel = require('../../model/adminModel')
const { OK, NOT_FOUND, BAD_REQUEST, FORBIDDEN, CONFLICT, GONE } = require('../../constants/httpStatusCodes')
const CustomError = require('../../constants/CustomError')
const userModel = require('../../model/userModel')
const otpVerificationModal = require('../../model/otpVerificationModal')
const { sendOtpToEmail } = require('../../helpers/sendOtp')
const passport = require('passport')
const { v4: uuid } = require('uuid')
const mongoose = require('mongoose')
const { sessionCookieMaxAge } = require('../../config/sessionConfig')
const walletModel = require('../../model/walletModel')
const { addAmountToWalletController } = require('../user/walletController')
const { viewAuthPage, viewAdminAuthPage } = require('../../constants/pageConfid')

// * auth check
const authenticate = async (username, password, modal) => {
  if (typeof username !== 'string' || typeof password !== 'string' ||
    username.length <= 1 || password.length < 6) {
    throw new CustomError("username or password is not valid", BAD_REQUEST)
  }
  const user = await modal.findOne({ username, isBlocked: false })
  if (!user) {
    throw new CustomError("username not found", FORBIDDEN)
  }
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new CustomError("password not valid", FORBIDDEN)
  }
  return user
}

// * admin
const getAdminLoginPageController = async (req, res, next) => {
  const { isAuthorized, user } = req?.session
  try {
    console.log("get admin page ")
    if (isAuthorized) {
      user?.isAdmin
        ? res.redirect('/admin')
        : res.redirect('/')
      return
    }
    res.render('auth/login', { ...viewAdminAuthPage })
  } catch (error) {
    next(error)
  }
}

const adminLoginController = async (req, res, next) => {
  const { username, password } = req.body
  try {
    const admin = await authenticate(username, password, adminModel)
    req.session.user = {
      name: admin.name,
      username: admin.username,
      isAdmin: true
    }
    req.session.isAuthorized = true
    // console.log(req.session)
    // const sessionUser = {
    //   name: admin.name,
    //   username: admin.username,
    //   isAdmin: true,
    //   provider: null
    // }
    // req.session.user = sessionUser
    // req.session.isAuthorized = true
    // res.cookie(
    //   'admin',
    //   JSON.stringify(sessionUser),
    //   { maxAge: sessionCookieMaxAge }
    // )

    res.status(OK).json({ message: "admin login success", user: admin })
  } catch (error) {
    console.error(error)
    next(error)
  }
}


// * user login
const getLoginPageController = async (req, res) => {
  try {
    if (req?.session?.isAuthorized) {
      req?.session?.user?.isAdmin
        ? res.redirect('/admin')
        : res.redirect('/')
      return
    }

    res.render('auth/login', { ...viewAuthPage })
  } catch (error) {
    console.log(error)
  }
}

const loginController = async (req, res, next) => {
  const { username, password } = req.body
  try {
    const user = await authenticate(username, password, userModel)
    const sessionUser = {
      userId: user.userId,
      name: user.name,
      username: user.username,
      isAdmin: false,
      provider: null
    }
    req.session.user = sessionUser
    req.session.isAuthorized = true
    res.cookie(
      'user',
      JSON.stringify(sessionUser),
      { maxAge: sessionCookieMaxAge }
    )
    res.status(OK).json({ message: "login success", user })
  } catch (error) {
    next(error)
  }
}

// * user signup
const getSignUpPageController = async (req, res, next) => {
  try {
    if (req?.session?.isAuthorized) {
      req?.session?.user?.isAdmin
        ? res.redirect('/admin')
        : res.redirect('/')
      return
    }
    res.render('auth/signup', { ...viewAuthPage })
  } catch (error) {
    next(error)
  }
}


const signUpController = async (req, res, next) => {
  const { name, username, password, referralCode } = req.body
  try {
    console.log(name, username, password)
    if (typeof name !== 'string' || typeof username !== 'string'
      || typeof password !== 'string' || username.length <= 1
      || password.length < 6
    ) {
      throw new CustomError("invalid username or password or name", BAD_REQUEST)
    }

    const isUserExists = await userModel.findOne({ username })
    if (isUserExists) throw new CustomError("user already exists", CONFLICT)

    const hashedPwd = await bcrypt.hash(password, 10)
    const data = await sendOtpToEmail({ email: username, name, password: hashedPwd, referralCode })
    res.status(OK).json(data)
  } catch (error) {
    next(error)
  }
}


// * otp controllers
const getVerifyPageController = async (req, res, next) => {
  const { isPasswordChange = false } = req.query
  try {
    res.render('auth/verifyOtp', { ...viewAuthPage, isPasswordChange })
  } catch (error) {
    next(error)
  }
}

// * verify otp
const verifyEmailController = async (req, res, next) => {
  const { username, otp, _id } = req.body
  console.log(username, otp, _id)
  try {
    if (!mongoose.isObjectIdOrHexString(_id) || typeof otp !== 'string' || otp.length !== 4) {
      throw new CustomError("invalid otp or email", BAD_REQUEST)
    }
    const otpUserVerificationRecord = await otpVerificationModal.findOne({ _id })
    if (!otpUserVerificationRecord || otpUserVerificationRecord.length === 0) {
      const message = "user has been verified already or otp doc notfound please sign up again"
      throw new CustomError(message, NOT_FOUND)
    }
    const { expiresAt } = otpUserVerificationRecord
    const hashedOtp = otpUserVerificationRecord.otp
    const { name, password, referralCode } = otpUserVerificationRecord
    if (expiresAt < Date.now()) {
      throw new CustomError("OTP has expired please request again", GONE)
    }

    const isValidOtp = await bcrypt.compare(otp, hashedOtp)
    if (!isValidOtp) {
      throw new CustomError("Invalid OTP. check your inbox", GONE)
    }


    const user = await userModel.create({
      userId: uuid(),
      name,
      username,
      password,
      referralCode: uuid().slice(0, 8),
      isVerified: true
    })

    // * adding amount on valid referral
    const referredUser = await userModel.findOne({ referralCode })

    // console.log("referralCode ", referralCode)
    // console.log("referredUser ")
    // console.log(referredUser)

    if (referredUser) {
      await walletModel.create({
        userId: user.userId,
        balance: 100,
        transactions: [{
          amount: 100,
          debit: false,
          credit: true,
        }]
      })

      const wallet = await walletModel.findOneAndUpdate(
        { userId: referredUser.userId },
        {
          $push: {
            transactions: {
              amount: 150,
              debit: false,
              credit: true
            }
          },
          $inc: { balance: 150 },
        },
        { new: true }
      )
      console.log("wallet ")
      console.log(wallet)
    } else {
      await walletModel.create({
        userId: user.userId,
        balance: 0,
      })
    }


    await otpVerificationModal.deleteMany({ _id })
    const sessionUser = {
      userId: user.userId,
      name: name,
      username: username,
      isAdmin: false,
      provider: null
    }
    req.session.user = sessionUser
    req.session.isAuthorized = true
    res.cookie(
      'user',
      JSON.stringify(sessionUser),
      { maxAge: sessionCookieMaxAge }
    )
    res.status(OK).json({ message: "email verified", user })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

const resendOtpController = async (req, res, next) => {
  try {
    const { email, _id } = req.body
    console.log(_id)
    if (!mongoose.isObjectIdOrHexString(_id)) {
      throw new CustomError("empty user details are not allowed", BAD_REQUEST)
    }
    const otpRecord = await otpVerificationModal.findOne({ _id })
    if (!otpRecord) {
      throw new CustomError("not user details found", BAD_REQUEST)
    }
    console.log(otpRecord)
    const { name, password } = otpRecord
    const data = await sendOtpToEmail({ email, name, password })
    res.status(OK).json(data)
  } catch (error) {
    next(error)
  }
}


const logoutController = async (req, res) => {
  try {
    const isAdmin = req?.session?.user?.isAdmin
      ? true : false
    await req.session.destroy()
    res.clearCookie('connect.sid')
    res.clearCookie('user')
    console.log("logout success")
    res.status(OK).json({ message: "logout success", isAdmin })
  } catch (error) {
    console.log(error)
  }
}

// *  oauth success response
const oauthSuccessController = async (req, res, next) => {
  try {
    const user = req.user
    console.log("cookie max age value", parseInt(process.env.SESSION_COOKIE_MAX_AGE))

    // console.log(req.user)
    // console.log(req?.Session)
    res.cookie(
      'user',
      JSON.stringify(user),
      { maxAge: sessionCookieMaxAge }
    )
    res.redirect('/')
  } catch (error) {
    next(error)
  }
}


const forgotPasswordController = async (req, res, next) => {
  const { username } = req.body
  try {
    const result = await sendOtpToEmail({ email: username, isPasswordChange: true })
    const passwordOtpData = {
      _id: result.data._id,
      username: result.data.username,
    }
    console.log("passwordOtpData ")
    console.log(passwordOtpData)
    res.status(OK).json({ message: 'otp send to email', passwordOtpData })
  } catch (error) {
    next(error)
  }
}

const validateOtpForChangePasswordController = async (req, res, next) => {
  const { username, otp, _id } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(_id) || typeof otp !== 'string' || otp.length !== 4) {
      throw new CustomError("invalid otp or email", BAD_REQUEST)
    }
    const otpUserVerificationRecord = await otpVerificationModal.findOne({ _id })
    if (!otpUserVerificationRecord || otpUserVerificationRecord.length === 0) {
      const message = "user has been verified already or otp doc notfound please sign up again"
      throw new CustomError(message, NOT_FOUND)
    }
    const { expiresAt } = otpUserVerificationRecord
    const hashedOtp = otpUserVerificationRecord.otp
    if (expiresAt < Date.now()) {
      throw new CustomError("OTP has expired please request again", GONE)
    }

    const isValidOtp = await bcrypt.compare(otp, hashedOtp)
    if (!isValidOtp) {
      throw new CustomError("Invalid OTP. check your inbox", GONE)
    }

    const user =await  userModel.findOne({ username:username })
    const sessionUser = {
      userId: user.userId,
      name: user.name,
      username: username,
      isAdmin: false,
      provider: null
    }
    req.session.user = sessionUser
    req.session.isAuthorized = true
    res.cookie(
      'user',
      JSON.stringify(sessionUser),
      { maxAge: 1000 * 60 * 5 }
    )
    res.status(OK).json({ message: 'email verified' })
  } catch (error) {
    next(error)
  }
}

const getPasswordChangePageController = async (req, res, next) => {
  try {
    const user = req.cookies.user
    if (!user) {
      res.redirect('/auth/login')
      return
    }
    res.render('auth/forgotPassword', { ...viewAuthPage })
  } catch (error) {
    next(error)
  }
}

const changePasswordController = async (req, res, next) => {
  const { password } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    if (!user) {
      throw new CustomError('invalid user', BAD_REQUEST)
    }
    if (password.length < 6) {
      throw new CustomError('password must be 6 characters', BAD_REQUEST)
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const updatedUser = await userModel.findOneAndUpdate(
      { userId: user.userId },
      { $set: { password: hashedPassword } },
      { new: true }
    )
    // * destroy session
    await req.session.destroy()
    res.clearCookie('connect.sid')
    res.clearCookie('user')

    // console.log("user")
    // console.log(user)
    // console.log("updatedUser")
    // console.log(updatedUser)

    res.status(OK).json({ message: 'password changed' })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminLoginPageController,
  adminLoginController,

  getVerifyPageController,
  verifyEmailController,
  resendOtpController,

  getLoginPageController,
  getSignUpPageController,
  loginController,
  signUpController,
  logoutController,

  oauthSuccessController,
  forgotPasswordController,
  validateOtpForChangePasswordController,
  getPasswordChangePageController,
  changePasswordController
}