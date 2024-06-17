
const getCategoriesController = async (req, res) => {
  try {
    res.render('admin/category/categoriesTable', { isAuthPage :false})
  } catch (error) {
    next(error)
  }
}


const getEditCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: true, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const getCreateCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: false, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}



module.exports = {
  getCategoriesController,
  getEditCategoryController,
  getCreateCategoryController
}