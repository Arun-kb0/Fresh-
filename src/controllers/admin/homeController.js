
const getAdminHomeController = async (req, res) => {
  try {
    res.render('admin/home/index', { isAuthPage :false})
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminHomeController
}