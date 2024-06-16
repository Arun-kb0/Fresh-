
const getCategoriesController = async (req, res) => {
  try {
    res.render('admin/category/categoriesTable')
  } catch (error) {
    next(error)
  }
}


const getEditCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: true })
  } catch (error) {
    next(error)
  }
}


const getCreateCategoryController = async (req, res) => {
  try {
    res.render('admin/category/editCategory', { isEdit: false })
  } catch (error) {
    next(error)
  }
}



module.exports = {
  getCategoriesController,
  getEditCategoryController,
  getCreateCategoryController
}