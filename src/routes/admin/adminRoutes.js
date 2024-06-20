const express = require('express')
const { getAdminHomeController } = require('../../controllers/admin/homeController')
const { getUserEditController, getUsersController, blockUserController } = require('../../controllers/admin/usersContoller')
const {
  getProductController,
  getEditProductController,
  getCreateProductController,
  createProductController,
  editProductController,
  deleteProductController } = require('../../controllers/admin/productController')
const {
  getEditCategoryController,
  getCreateCategoryController,
  getCategoriesController,
  editCategoryController,
  createCategoryController,
  deleteCategoryController
} = require('../../controllers/admin/categoryController')
const multer = require("multer")


const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })



router.route('/')
  .get(getAdminHomeController)

// * user
router.get('/users', getUsersController)
router.patch('/user/block', blockUserController)

// * products
router.get('/products', getProductController)
router.route('/product/edit')
  .get(getEditProductController)
  .patch(upload.single("filename"), editProductController)
  .delete(deleteProductController)

router.route('/product/create')
  .get(getCreateProductController)
  .post(upload.single("filename"), createProductController)

// * category
router.get('/categories', getCategoriesController)
router.route('/category/edit')
  .get(getEditCategoryController)
  .patch(upload.single("filename"), editCategoryController)
  .delete(deleteCategoryController)

router.route('/category/create')
  .get(getCreateCategoryController)
  .post(upload.single("filename"),createCategoryController)






module.exports = router
