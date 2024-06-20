const express = require('express')
const { getProductsController } = require('../../controllers/user/productsController')
const router = express.Router()

router.get('/', getProductsController)


module.exports = router