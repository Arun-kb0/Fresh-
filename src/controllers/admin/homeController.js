
const getAdminHomeController = async (req, res) => {
  try {
    res.render('admin/home/index')
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminHomeController
}