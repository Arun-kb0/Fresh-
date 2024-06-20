const { viewUsersPage } = require("../../constants/pageConfid")
const productModel = require('../../model/productModel')

const getProductsController =async (req,res,next) => {
  try {
    const products = await productModel.find({ isDeleted: false }).limit(9)
    res.render('user/index', {...viewUsersPage , products})
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getProductsController
}