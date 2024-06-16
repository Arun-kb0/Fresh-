const bcrypt = require('bcrypt')
const adminModel = require('../model/adminModel')
const { OK, NOT_FOUND, BAD_REQUEST, FORBIDDEN, CONFLICT, GONE } = require('../constants/httpStatusCodes')
const CustomError = require('../constants/CustomError')
const userModel = require('../model/userModel')
const nodeMailer = require('nodemailer')
const otpVerificationModal = require('../model/otpVerificationModal')


// * nodemailer transport
const transporter = nodeMailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
})




const authenticate = async (username, password, modal) => {
  if (typeof username !== 'string' || typeof password !== 'string' ||
    username.length <= 1 || password.length < 6) {
    throw new CustomError("username or password is not valid", BAD_REQUEST)
  }
  const user = await modal.findOne({ username })
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
  try {
    res.render('auth/auth-login-basic', { isAdmin: true })
  } catch (error) {
    next(error)
  }
}

const adminLoginController = async (req, res, next) => {
  const { username, password } = req.body
  try {
    const admin = await authenticate(username, password, adminModel)
    req.session.admin = {
      name: admin.name,
      username: admin.username
    }

    res.status(OK).json({ message: "admin login success", admin })
  } catch (error) {
    next(error)
  }
}



// * user login

const getLoginPageController = async (req, res) => {
  try {
    res.render('auth/auth-login-basic', { isAdmin: false })
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
      username: user.username
    }
    res.status(OK).json({ message: "login success", user })
  } catch (error) {
    next(error)
  }
}

// * user signup

const getSignUpPageController = async (req, res, next) => {
  try {
    res.render('auth/auth-register-basic')
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
    const user = await userModel.create({
      name,
      username,
      password: hashedPwd
    })

    const data = await sendOtpToEmail({ email: user.username, _id: user._id })
    res.status(OK).json(data)
  } catch (error) {
    next(error)
  }
}

// * send otp function
const sendOtpToEmail = async ({ _id, email }) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    const html = `<p> Enter <b>${otp}</b> to verify your email address and complete signup</p >
      <p>This code will expire after 10 minutes</p>`
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "verify email",
      html: html
    }
    const hashedOtp = await bcrypt.hash(otp, 10)
    const newOtpVerification = await otpVerificationModal.create({
      userId: _id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000
    })
    await transporter.sendMail(mailOptions)
    return ({
      status: "pending",
      message: "Verify otp in email",
      data: {
        userId: _id,
        email
      }
    })
  } catch (error) {
    return ({
      status: "failed",
      message: error.message
    })
  }
}




const getVerifyPageController = async (req, res, next) => {
  try {
    res.render('auth/verifyOtp')
  } catch (error) {
    next(error)
  }
}

// * verify otp
const verifyEmailController = async (req, res, next) => {
  const { userId, otp } = req.body
  console.log(userId, otp)
  try {
    if (typeof userId !== 'string' || typeof otp !== 'string'
      || userId.length !== 24 || otp.length !== 4
    ) {
      throw new CustomError("invalid otp or userId", BAD_REQUEST)
    }
    const otpUserVerificationRecord = await otpVerificationModal.findOne({ userId })
    if (!otpUserVerificationRecord || otpUserVerificationRecord.length === 0) {
      const message = "Account record does't exists or has been verified already please sign up again"
      throw new CustomError(message, NOT_FOUND)
    }
    const { expiresAt } = otpUserVerificationRecord
    const hashedOtp = otpUserVerificationRecord.otp
    if (expiresAt < Date.now()) {
      await otpVerificationModal.deleteMany({ userId })
      throw new CustomError("OTP has expired please request again", GONE)
    }

    const isValidOtp = await bcrypt.compare(otp, hashedOtp)
    if (!isValidOtp) {
      throw new CustomError("Invalid OTP. check your inbox", GONE)
    }

    const user = await userModel.findOneAndUpdate(
      { _id: userId },
      { isVerified: true },
      { new: true }
    )
    await otpVerificationModal.deleteMany({ userId })

    req.session.user = {
      name: user.name,
      username: user.username
    }
    res.status(OK).json({ message: "email verified", user })
  } catch (error) {
    // console.error(error)
    next(error)
  }
}

const resendOtpController = async (req, res, next) => {
  try {
    const { userId, email } = req.body
    if (typeof userId !== 'string' || typeof email !== 'string'
      || userId.length !== 24 || email.length <= 1
    ) {
      throw new CustomError("empty user details are not allowed", BAD_REQUEST)
    }
    await otpVerificationModal.deleteMany({ userId })
    const data = await sendOtpToEmail({ _id: userId, email })
    res.status(OK).json(data)
  } catch (error) {
    next(error)
  }
}


const logoutController = async (req, res) => {
  try {

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
  logoutController
}