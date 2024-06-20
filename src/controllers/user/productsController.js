const { viewUsersPage } = require("../../constants/pageConfid")

const getProductsController =async (req,res,next) => {
  try {
    
    res.render('user/index', viewUsersPage)
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getProductsController
}