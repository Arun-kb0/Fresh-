const bcrypt = require('bcrypt')
const adminModel = require('../model/adminModel')
const { OK, NOT_FOUND, BAD_REQUEST, FORBIDDEN, CONFLICT } = require('../constants/httpStatusCodes')
const CustomError = require('../constants/CustomError')
const userModel = require('../model/userModel')


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
    res.render('auth/auth-login-basic',{isAdmin:true})
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
    res.render('auth/auth-login-basic', {isAdmin:false})
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
    req.session.user = {
      name: user.name,
      username: user.username
    }
    res.status(OK).json({ message: "signup success", user })
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

  getLoginPageController,
  getSignUpPageController,
  loginController,
  signUpController,
  logoutController
}