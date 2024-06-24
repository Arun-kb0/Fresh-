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
  logoutController,
  oauthSuccessController,
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
router.get('/logout', logoutController)


// * google oAuth passport
router.get('/google', passport.authenticate('google', {
  scope: ['email', 'profile']
}))

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  oauthSuccessController
)

// * passport facebook route
router.get('/facebook',
  passport.authenticate('facebook'));

router.get('/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/auth/login'
  }),
  oauthSuccessController
)



module.exports = router