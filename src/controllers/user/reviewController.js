const { default: mongoose } = require("mongoose")
const { OK } = require("../../constants/httpStatusCodes")
const productModel = require("../../model/productModel")
const reviewModel = require("../../model/reviewModel")


const createReviewController = async (req, res, next) => {
  const { productId, reviewMessage, rating } = req.body
  try {
    console.log(productId, reviewMessage)
    const user = JSON.parse(req.cookies.user)
    const isReviewExists = await reviewModel.findOne({ userId: user.userId, productId })
    let updatedReview
    if (!isReviewExists) {
      updatedReview = await reviewModel.create({
        userId: user.userId,
        productId: productId,
        rating: parseInt(rating),
        review: reviewMessage
      })
    } else {
      updatedReview = await reviewModel.findOneAndUpdate(
        { userId: user.userId, productId },
        {
          $set: {
            rating: rating,
            review: reviewMessage
          }
        }
      )
    }

    const productObjId = mongoose.Types.ObjectId.createFromHexString(productId)
    const result = await reviewModel.aggregate([
      { $match: { productId: productObjId } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          peopleRated: { $sum: 1 },
        },
      },
    ]);
    console.log(result)
    const { averageRating, peopleRated } = result[0]
    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: productId },
      {
        $set: {
          rating: averageRating,
          peopleRated: peopleRated
        }
      }
    )

    res.status(OK).json({ message: "your review has updated" })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  createReviewController
}