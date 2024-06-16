const express = require('express')
const {
  loginController, getSignUpPageController,
  signUpController,
  getAdminLoginPageController,
  adminLoginController,
  getLoginPageController,
  getVerifyPageController,
  verifyEmailController,
  resendOtpController
} = require('../controllers/authControllers')

const router = express.Router()


// * admin
router.route('/admin/login')
  .get(getAdminLoginPageController)
  .post(adminLoginController)


// *user 
router.route('/login')
  .get(getLoginPageController)
  .post(loginController)


router.route('/signup')
  .get(getSignUpPageController)
  .post(signUpController)

router.route('/verifyemail')
  .get(getVerifyPageController)
  .post(verifyEmailController)

router.post('/resendotp' , resendOtpController )


module.exports = router