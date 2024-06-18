const express = require('express')
const { getAdminHomeController } = require('../../controllers/admin/homeController')
const { getUserEditController, getUsersController } = require('../../controllers/admin/usersContoller')
const { getProductController, getEditProductController, getCreateProductController } = require('../../controllers/admin/productController')
const { getEditCategoryController,
  getCreateCategoryController, getCategoriesController, editCategoryController,
  createCategoryController, deleteCategoryController

} = require('../../controllers/admin/categoryController')


const router = express.Router()

router.route('/')
  .get(getAdminHomeController)

// * user
router.get('/users', getUsersController)
router.route('/user')
  .get(getUserEditController)

// * products
router.get('/products', getProductController)
router.route('/product/edit')
  .get(getEditProductController)

router.route('/product/create')
  .get(getCreateProductController)

// * category
router.get('/categories', getCategoriesController)
router.route('/category/edit')
  .get(getEditCategoryController)
  .patch(editCategoryController)
  .delete(deleteCategoryController)

router.route('/category/create')
  .get(getCreateCategoryController)
  .post(createCategoryController)






module.exports = router
