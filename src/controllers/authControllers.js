
const getLoginPageController = async (req, res) => {
  try {
    res.render('admin/auth/auth-login-basic')
  } catch (error) {
    console.log(error)
  }
}


const getSignUpPageController = async (req, res) => {
  try {
    res.render('admin/auth/auth-register-basic')
  } catch (error) {
    console.log(error)
  }
}




const loginController = async (req, res) => {
  try {

  } catch (error) {
    console.log(error)
  }
}


const signUpController = async (req, res) => {
  try {

  } catch (error) {
    console.log(error)
  }
}


const logoutController = async (req, res) => {
  try {

  } catch (error) {
    console.log(error)
  }
}



module.exports = {
  getLoginPageController,
  getSignUpPageController,

  loginController,
  signUpController,
  logoutController
}