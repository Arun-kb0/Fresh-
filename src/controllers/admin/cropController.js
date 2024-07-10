const { viewAdminPage } = require("../../constants/pageConfid")


const getCropperController = async (req, res, next) => {
  try {
    res.render('admin/cropper/imageCropper',{...viewAdminPage})
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCropperController
}