const express = require('express')
const {
  getProductsController,
  getSingleProductController,
  getTopBrandsProductsController,
  getPopularProductsController,
  getTopRatedProductsController,
  getNewProductsController,
  getProductsProductsPageController,
  getProductSearchResultController,

} = require('../../controllers/user/productsController')
const router = express.Router()

router.get('/', getProductsController)

router.route("/product")
  .get(getSingleProductController)
  
router.get('/products/latest', getNewProductsController)
router.get('/products/topbrands', getTopBrandsProductsController)
router.get('/products/popular', getPopularProductsController)
router.get('/products/toprated', getTopRatedProductsController)


// * products page
router.get('/products', getProductsProductsPageController)
router.get('/products/search', getProductSearchResultController)

module.exports = router