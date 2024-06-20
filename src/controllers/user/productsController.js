
const getProductsController =async (req,res,next) => {
  try {
    
    res.render('user/index', viewUser)
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getProductsController
}