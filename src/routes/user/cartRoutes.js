const express = require('express')
const {
  getCartPageController,
  addToCartController
} = require('../../controllers/user/cartController')
const router = express.Router()


router.route('/')
  .get(getCartPageController)
  .patch(addToCartController)


module.exports = router