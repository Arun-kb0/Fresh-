const express = require('express')
const { getAdminHomeController } = require('../../controllers/admin/homeController')
const { getUserEditController, getUsersController, blockUserController } = require('../../controllers/admin/usersContoller')
const {
  getProductController,
  getEditProductController,
  getCreateProductController,
  createProductController,
  editProductController,
  deleteProductController,
  deleteImageController } = require('../../controllers/admin/productController')
const {
  getEditCategoryController,
  getCreateCategoryController,
  getCategoriesController,
  editCategoryController,
  createCategoryController,
  deleteCategoryController,
  getAllCategoriesForDropDown
} = require('../../controllers/admin/categoryController')
const multer = require("multer")
const { getAllOrdersAdminPageController, changeOrderStatusController, changePaymentStatusController, getOrderDetailsAdminPageController, cancelSingleOrderController } = require('../../controllers/admin/orderController')
const { getCropperController } = require('../../controllers/admin/cropController')
const { createCouponController,
  deleteCouponController,
  getCreateCouponPageController, 
  getCouponsPageController} = require('../../controllers/admin/couponController')
const { getAdminOffersTablePageController, getCreateOfferPageController, createOfferController, deleteOfferController } = require('../../controllers/offferController')
const { getSalesReportController } = require('../../controllers/admin/reportsController')


const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 1024 * 1024 * 2
  }
})





router.route('/')
  .get(getAdminHomeController)

// * crop image
router.get('/image/crop', getCropperController)

// * user
router.get('/users', getUsersController)
router.patch('/user/block', blockUserController)

// * products
router.get('/products', getProductController)
router.route('/product/edit')
  .get(getEditProductController)
  .patch(upload.array("filename", 5), editProductController)
  .delete(deleteProductController)

router.delete('/product/image', deleteImageController)


router.route('/product/create')
  .get(getCreateProductController)
  .post(upload.array("filename", 5), createProductController)

// * category
router.get('/categories', getCategoriesController)
router.get('/categoriesForDropdown', getAllCategoriesForDropDown)
router.route('/category/edit')
  .get(getEditCategoryController)
  .patch(upload.single("filename"), editCategoryController)
  .delete(deleteCategoryController)

router.route('/category/create')
  .get(getCreateCategoryController)
  .post(upload.single("filename"), createCategoryController)


router.route('/orders')
  .get(getAllOrdersAdminPageController)
router.get('/order/details', getOrderDetailsAdminPageController)
router.patch('/order/orderstatus', changeOrderStatusController)
router.patch('/order/paymentstatus', changePaymentStatusController)

router.patch('/order/product/cancel',cancelSingleOrderController)


// * coupons
router.route('/coupon')
  .get(getCouponsPageController)
  .delete(deleteCouponController)

router.route('/coupon/create')
  .get(getCreateCouponPageController)
  .post(upload.single("filename"), createCouponController)

router.route('/offer')
  .get(getAdminOffersTablePageController)
  .delete(deleteOfferController)

router.route('/offer/create')
  .get(getCreateOfferPageController)
  .post(upload.single('filename'), createOfferController)
  

router.get('/report/sales',getSalesReportController)


module.exports = router
