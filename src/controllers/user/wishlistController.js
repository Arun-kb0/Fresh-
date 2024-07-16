const CustomError = require("../../constants/CustomError")
const { OK, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const mongoose = require('mongoose')
const wishlistModel = require("../../model/wishlistModel")

const getWishlistController = async (req, res, next) => {
  try {
    const user = JSON.parse(req?.cookies?.user)
    // * add wishlist aggregation
    const result = await wishlistModel.aggregate([
      {
        $match: {
          userId: user.userId
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "productIds",
          foreignField: "_id",
          as: "products"
        }
      },
      {
        $project: {
          _id: 0,
          products: 1
        }
      }
    ])

    console.log("result ")
    console.log(result[0])

    res.render('user/profile/wishlist', { ...viewUsersPage, products: result[0]?.products ? result[0].products : []  })
  } catch (error) {
    next(error)
  }
}

const addToWishlistController = async (req, res, next) => {
  const { productId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const userId = user.userId
    console.log(req.body)
    if (!mongoose.isObjectIdOrHexString(productId)) {
      throw new CustomError("invalid product id", BAD_REQUEST)
    }
    console.log(productId)
    const productObjId = mongoose.Types.ObjectId.createFromHexString(productId)

    const isWishlistExists = await wishlistModel.findOne({ userId })
    let wishlist
    if (isWishlistExists) {
      if (isWishlistExists?.productIds?.includes(productObjId)) {
        wishlist = await wishlistModel.findOneAndUpdate(
          { userId },
          { $pull : { productIds: productObjId } },
          { new: true }
        )
      } else {
        wishlist = await wishlistModel.findOneAndUpdate(
          { userId },
          { $addToSet: { productIds: productObjId } },
          { new: true }
        )
      }
    } else {
      wishlist = await wishlistModel.create({
        userId,
       productIds: [productObjId] 
      })
  }
    console.log(wishlist)
  res.status(OK).json({ message: 'add to wishlist success', wishlist })
} catch (error) {
  next(error)
}
}

module.exports = {
  addToWishlistController,
  getWishlistController
}