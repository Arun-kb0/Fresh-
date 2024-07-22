const express = require('express')
const {
  getCartPageController,
  addToCartController,
  updateQuantityController,
  deleteItemFromCartController,
  getCheckoutPageController,
  orderUsingCodController,
  cancelOrderController,
  returnOrderController,
  applyCouponController,
  orderUsingPaypalController,
  orderSuccessPaypalController,
  removeCouponController
} = require('../../controllers/user/cartController')
const router = express.Router()


router.route('/')
  .get(getCartPageController)
  .patch(addToCartController)

router.patch('/updateqty', updateQuantityController)
router.delete('/deleteitem', deleteItemFromCartController)

router.route('/checkout')
  .get(getCheckoutPageController)
  .post(applyCouponController)

router.patch('/checkout/coupon/remove', removeCouponController)


router.post('/order/cod', orderUsingCodController)
router.patch('/order/cancel',cancelOrderController)
router.patch('/order/return',returnOrderController)

router.post('/order/paypal', orderUsingPaypalController)
router.post('/order/paypal/success', orderSuccessPaypalController)




module.exports = router