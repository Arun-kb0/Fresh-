const express = require('express')
const {
  getProfileController,
  getAddressController,
  createAddressController,
  editAddressController,
  deleteAddressController,
  getSingleAddressController,
  
 } = require('../../controllers/user/profileController')
const router = express.Router()



router.get('/', getProfileController)
router.route('/address')
  .get(getAddressController)
  .post(createAddressController)
  .patch(editAddressController)
  .delete(deleteAddressController)

router.get('/singleaddress', getSingleAddressController)

module.exports = router