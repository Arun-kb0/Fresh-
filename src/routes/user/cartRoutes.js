const express = require('express')
const {
  getCartPageController,
  addToCartController,
  updateQuantityController,
  deleteItemFromCartController,
  getCheckoutPageController,
  orderUsingCodController,
  cancelOrderController,
  returnOrderController
} = require('../../controllers/user/cartController')
const router = express.Router()


router.route('/')
  .get(getCartPageController)
  .patch(addToCartController)

router.patch('/updateqty', updateQuantityController)
router.delete('/deleteitem', deleteItemFromCartController)

router.get('/checkout', getCheckoutPageController)

router.post('/order/cod', orderUsingCodController)
router.patch('/order/cancel',cancelOrderController)
router.patch('/order/return',returnOrderController)




module.exports = router