
const getProductController = async (req, res) => {
  try {
    res.render('admin/products/productsTable', { isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const getEditProductController = async (req, res) => {
  try {
    res.render('admin/products/editProduct', { isEdit: true, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const getCreateProductController = async (req, res) => {
  try {
    res.render('admin/products/editProduct', { isEdit: false, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}



module.exports = {
  getProductController,
  getEditProductController,
  getCreateProductController
}