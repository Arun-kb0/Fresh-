const express = require('express')
const {
  loginController, getLoginPageController, getSignUpPageController,
  signUpController
} = require('../controllers/authControllers')

const router = express.Router()


router.route('/login')
  .get(getLoginPageController)
  .post(loginController)

router.route('/signup')
  .get(getSignUpPageController)
  .post(signUpController)



module.exports = router