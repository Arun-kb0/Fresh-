
const getProductController = async (req, res) => {
  try {
    res.render('admin/products/productsTable')
  } catch (error) {
    next(error)
  }
}


const getEditProductController = async (req, res) => {
  try {
    res.render('admin/products/editProduct',{isEdit:true})
  } catch (error) {
    next(error)
  }
}


const getCreateProductController = async (req, res) => {
  try {
    res.render('admin/products/editProduct', {isEdit:false})
  } catch (error) {
    next(error)
  }
}



module.exports = {
  getProductController,
  getEditProductController,
  getCreateProductController
}