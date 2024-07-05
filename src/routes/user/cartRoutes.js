const express = require('express')
const {
  getCartPageController,
  addToCartController,
  updateQuantityController,
  deleteItemFromCartController,
  getCheckoutPageController,
  orderUsingCodController
} = require('../../controllers/user/cartController')
const router = express.Router()


router.route('/')
  .get(getCartPageController)
  .patch(addToCartController)

router.patch('/updateqty', updateQuantityController)
router.delete('/deleteitem', deleteItemFromCartController)

router.get('/checkout', getCheckoutPageController)

router.post('/placeordercod', orderUsingCodController)




module.exports = router