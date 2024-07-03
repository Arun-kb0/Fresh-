const express = require('express')
const {
  getCartPageController,
  addToCartController,
  updateQuantityController
} = require('../../controllers/user/cartController')
const router = express.Router()


router.route('/')
  .get(getCartPageController)
  .patch(addToCartController)

router.patch('/updateqty', updateQuantityController)


module.exports = router