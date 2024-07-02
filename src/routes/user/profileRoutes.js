const express = require('express')
const {
  getProfileController,
  getAddressController,
  
 } = require('../../controllers/user/profileController')
const router = express.Router()



router.get('/', getProfileController)
router.route('/address')
  .get(getAddressController)


module.exports = router