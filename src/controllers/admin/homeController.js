const { viewAdminPage } = require("../../constants/pageConfid")

const getAdminHomeController = async (req, res) => {
  try {
    res.render('admin/home/index', viewAdminPage)
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminHomeController
}