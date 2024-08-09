const express = require('express')
const {
  loginController, getSignUpPageController,
  signUpController,
  getAdminLoginPageController,
  adminLoginController,
  getLoginPageController,
  getVerifyPageController,
  verifyEmailController,
  resendOtpController,
  oauthSuccessController,
  forgotPasswordController,
  validateOtpForChangePasswordController,
  getPasswordChangePageController,
  changePasswordController,
  userLogoutController,
  adminLogoutController,
} = require('../../controllers/auth/authControllers')
const passport = require('passport')

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

router.post('/resendotp', resendOtpController)

// * logout
router.get('/admin/logout', adminLogoutController)
router.get('/logout', userLogoutController)


// * google oAuth passport
router.get('/google', passport.authenticate('google', {
  scope: ['email', 'profile'],
  prompt:"select_account"
}))

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  oauthSuccessController
)

// * passport facebook route
router.get('/facebook',
  passport.authenticate('facebook'));
// router.get('/facebook',
//   passport.authenticate('facebook', {
//     prompt: "select_account"
//   }));

router.get('/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/auth/login'
  }),
  oauthSuccessController
)


// * change Password routes
router.post('/password/forgot',forgotPasswordController)
router.post('/password/validate',validateOtpForChangePasswordController)
router.route('/password/change')
  .get(getPasswordChangePageController)
  .post(changePasswordController)

module.exports = router