const CustomError = require("../../constants/CustomError")
const { OK, NOT_FOUND, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage} = require("../../constants/pageConfid")
const addressModel = require("../../model/addressModel")


const getAddressController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const address = await addressModel.find({ userId: user.userId })
    if (!address) {
      throw new CustomError('no address for user', NOT_FOUND)
    }
    // res.status(OK).json({ address: address })
    res.render('user/profile/address', { ...viewUsersPage, address })
  } catch (error) {
    next(error)
  }
}

const createAddressController = async (req, res, next) => {
  const address = req.body
  try {

    const user = JSON.parse(req.cookies.user)
    const newAddress = await addressModel.create({
      userId: user.userId,
      ...address
    })

    res.status(OK).json({ message: "new address added", address: newAddress })
  } catch (error) {
    next(error)
  }
}

const editAddressController = async (req, res, next) => {
  const { addressId, ...address } = req.body
  try {
    // console.log(addressId)
    if (!addressId) {
      throw new CustomError("invalid id ", BAD_REQUEST)
    }
    const updatedAddress = await addressModel.findOneAndUpdate(
      { _id: addressId },
      { ...address },
      { new: true }
    )
    if (!updatedAddress) {
      throw new CustomError("address not found ", NOT_FOUND)
    }

    res.status(OK).json({ message: "address updated", address: updatedAddress })
  } catch (error) {
    next(error)
  }
}

const deleteAddressController = async (req, res, next) => {
  const { addressId } = req.query
  try {
    const result = await addressModel.deleteOne({ _id: addressId })
    if (result.deletedCount === 0) {
      throw new CustomError('already deleted', NOT_FOUND)
    }
    res.status(OK).json({ message: "address deleted" })
  } catch (error) {
    next(error)
  }
}

const getSingleAddressController = async (req, res, next) => {
  const { addressId } = req.query
  try {
    // console.log(addressId)
    const address = await addressModel.findOne({ _id: addressId })
    if (!address) {
      throw new CustomError("address not found", NOT_FOUND)
    }
    res.status(OK).json({ message: "get single order success", address })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAddressController,
  createAddressController,
  editAddressController,
  deleteAddressController,
  getSingleAddressController,
}