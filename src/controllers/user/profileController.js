const { sessionCookieMaxAge } = require("../../config/sessionConfig")
const CustomError = require("../../constants/CustomError")
const { OK, NOT_FOUND, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const addressModel = require("../../model/addressModel")
const productModel = require("../../model/productModel")
const userModel = require("../../model/userModel")
const bcrypt = require('bcrypt')

const getProfileController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    const products = await productModel.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "categoryId",
          foreignField: "_id",
          as: "subcategory"
        }
      },
      {
        $addFields: {
          subcategory: {
            $filter: {
              input: "$subcategory",
              as: "category",
              cond: {
                $eq: ["$$category.isDeleted", false]
              }
            }
          }
        }
      },
      {
        $unwind: {
          path: "$subcategory",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: {
          rating: 1,
          name: 1
        }
      },
      {
        $skip: startIndex
      },
      {
        $limit: LIMIT
      }
    ])
    res.render('user/profile/profile', { ...viewUsersPage, suggestions: products })
  } catch (error) {
    next(error)
  }
}

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
    console.log(addressId)
    const address = await addressModel.findOne({ _id: addressId })
    if (!address) {
      throw new CustomError("address not found", NOT_FOUND)
    }
    res.status(OK).json({ message: "get single order success", address })
  } catch (error) {
    next(error)
  }
}

// * edit profile
const getUserDetailsPageController = async (req, res, next) => {
  try {
    const cookieUser = JSON.parse(req.cookies?.user)
    const user = await userModel.findOne({ userId: cookieUser.userId})
    res.render('user/profile/editUser', { ...viewUsersPage, user: user })
  } catch (error) {
    next(error)
  }
}

const getUserDetailsController = async (req, res, next) => {
  try {
    const cookieUser = JSON.parse(req.cookies?.user)
    const user = await userModel.findOne({ userId: cookieUser.userId })
    res.status(OK).json({message:"get user details success", user: user })
  } catch (error) {
    next(error)
  }
}

const editUserController = async (req, res, next) => {
  const { userId, name, username, password } = req.body
  try {
    let updateField={}
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
      updateField.password = hashedPassword
    }
    if(name) updateField.name = name
    if (username) updateField.username = username
    
    const editedUser = await userModel.findOneAndUpdate(
      { userId },
      {...updateField},
      { new: true }
    )

    const sessionUser = {
      userId: editedUser.userId,
      name: editedUser.name,
      username: editedUser.username,
      isAdmin: false,
      provider: null
    }
    res.cookie(
      'user',
      JSON.stringify(sessionUser),
      { maxAge: sessionCookieMaxAge }
    )
    
    res.status(OK).json({ message: "edit user success", user: editedUser })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getProfileController,
  getAddressController,
  createAddressController,
  editAddressController,
  deleteAddressController,
  getSingleAddressController,

  editUserController,
  getUserDetailsController,
  getUserDetailsPageController
}