const express = require('express')
const {
  getProfileController,
  getAddressController,
  createAddressController,
  editAddressController,
  deleteAddressController,
  getSingleAddressController,
  getUserDetailsController,
  editUserController,
  getUserDetailsPageController,
  
 } = require('../../controllers/user/profileController')
const router = express.Router()



router.get('/', getProfileController)
router.route('/address')
  .get(getAddressController)
  .post(createAddressController)
  .patch(editAddressController)
  .delete(deleteAddressController)

router.get('/singleaddress', getSingleAddressController)

// * edit profile
router.route("/user")
  .get(getUserDetailsPageController)
  .patch(editUserController)
router.get('/userdetails', getUserDetailsController)

module.exports = router