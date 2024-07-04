const express = require('express')
const {
  getCartPageController,
  addToCartController,
  updateQuantityController,
  deleteItemFromCartController
} = require('../../controllers/user/cartController')
const router = express.Router()


router.route('/')
  .get(getCartPageController)
  .patch(addToCartController)

router.patch('/updateqty', updateQuantityController)
router.delete('/deleteitem', deleteItemFromCartController)


module.exports = router