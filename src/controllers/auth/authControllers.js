const bcrypt = require('bcrypt')
const adminModel = require('../../model/adminModel')
const { OK, NOT_FOUND, BAD_REQUEST, FORBIDDEN, CONFLICT, GONE } = require('../../constants/httpStatusCodes')
const CustomError = require('../../constants/CustomError')
const userModel = require('../../model/userModel')
const otpVerificationModal = require('../../model/otpVerificationModal')
const { sendOtpToEmail } = require('../../helpers/sendOtp')
const passport = require('passport')







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
    res.render('auth/login', { isAdmin: true, isAuthPage: true })
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
    console.log(req.session)

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

    res.render('auth/login', { isAdmin: false, isAuthPage: true })
  } catch (error) {
    console.log(error)
  }
}

const loginController = async (req, res, next) => {
  const { username, password } = req.body
  try {
    const user = await authenticate(username, password, userModel)
    req.session.user = {
      name: user.name,
      username: user.username,
      isAdmin: false
    }
    req.session.isAuthorized = true
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
    res.render('auth/signup', { isAuthPage: true })
  } catch (error) {
    next(error)
  }
}


const signUpController = async (req, res, next) => {
  const { name, username, password } = req.body
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
    const data = await sendOtpToEmail({ email: username, name, password: hashedPwd })
    res.status(OK).json(data)
  } catch (error) {
    next(error)
  }
}


// * otp controllers
const getVerifyPageController = async (req, res, next) => {
  try {
    res.render('auth/verifyOtp', { isAuthPage: true })
  } catch (error) {
    next(error)
  }
}

// * verify otp
const verifyEmailController = async (req, res, next) => {
  const { username, otp } = req.body
  console.log(username, otp)
  try {
    if (typeof username !== 'string' || typeof otp !== 'string' || otp.length !== 4) {
      throw new CustomError("invalid otp or userId", BAD_REQUEST)
    }
    const otpUserVerificationRecord = await otpVerificationModal.findOne({ username })
    if (!otpUserVerificationRecord || otpUserVerificationRecord.length === 0) {
      const message = "user has been verified already please sign up again"
      throw new CustomError(message, NOT_FOUND)
    }
    const { expiresAt } = otpUserVerificationRecord
    const hashedOtp = otpUserVerificationRecord.otp
    const { name, password } = otpUserVerificationRecord
    if (expiresAt < Date.now()) {
      await otpVerificationModal.deleteMany({ username })
      throw new CustomError("OTP has expired please request again", GONE)
    }

    const isValidOtp = await bcrypt.compare(otp, hashedOtp)
    if (!isValidOtp) {
      throw new CustomError("Invalid OTP. check your inbox", GONE)
    }

    const user = await userModel.create({
      name,
      username,
      password,
      isVerified: true
    })
    await otpVerificationModal.deleteMany({ username })
    req.session.user = {
      name: name,
      username: username,
      isAdmin: false
    }
    req.session.isAuthorized = true
    res.status(OK).json({ message: "email verified", user })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

const resendOtpController = async (req, res, next) => {
  try {
    const { email } = req.body
    if (typeof email !== 'string' || email.length <= 1) {
      throw new CustomError("empty user details are not allowed", BAD_REQUEST)
    }
    const otpRecord = await otpVerificationModal.findOne({ username: email })
    await otpVerificationModal.deleteMany({ username: email })
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
    console.log("logout success")
    res.status(OK).json({ message: "logout success", isAdmin })
  } catch (error) {
    console.log(error)
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

  
}