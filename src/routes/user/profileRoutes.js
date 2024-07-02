const express = require('express')
const {
  getProfileController,
  getAddressController,
  createAddressController,
  editAddressController,
  deleteAddressController,
  
 } = require('../../controllers/user/profileController')
const router = express.Router()



router.get('/', getProfileController)
router.route('/address')
  .get(getAddressController)
  .post(createAddressController)
  .patch(editAddressController)
  .delete(deleteAddressController)


module.exports = router