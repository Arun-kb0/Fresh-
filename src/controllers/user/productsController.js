const { viewUsersPage } = require("../../constants/pageConfid")
const productModel = require('../../model/productModel')


const getProductsController =async (req,res,next) => {
  try {
    const products = await productModel.find({ isDeleted: false }).skip(6).limit(9)
    res.render('user/home/home', {...viewUsersPage , products})
  } catch (error) {
    next(error)
  }
}


const getSingleProductController = async (req, res, next) => {
  const { productId } = req.query
  console.log(productId)
  try {
    const product = await productModel.findOne({ _id: productId, isDeleted: false })
    console.log(product)
    res.render('user/products/singleProduct', { ...viewUsersPage, product })
  } catch (error) {
    next(error)
  }
}




module.exports = {
  getProductsController,
  getSingleProductController
}