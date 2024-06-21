const express = require('express')
const { getProductsController, getSingleProductController } = require('../../controllers/user/productsController')
const router = express.Router()

router.get('/', getProductsController)

router.route("/product")
  .get(getSingleProductController)

module.exports = router