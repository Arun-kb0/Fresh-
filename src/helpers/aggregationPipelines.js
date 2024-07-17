const productModel = require("../model/productModel")

const getProductsAggregation = async ({ sort, skip, limit, userId = '' }) => {
  console.log("userId ", userId)
  const products = await productModel.aggregate([
    {
      $match: {
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: "offers",
        localField: "_id",
        foreignField: "productIds",
        as: "offerDetails"
      }
    },
    {
      $unwind: {
        path: "$offerDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$_id",
        productDetails: {
          $first: "$$ROOT"
        },
        offerDetails: {
          $push: "$offerDetails"
        }
      }
    },
    {
      $addFields: {
        "productDetails.offerDetails": {
          $arrayElemAt: ["$offerDetails", 0]
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: "$productDetails"
      }
    },
    {
      $lookup: {
        from: "wishlists",
        let: {
          productId: "$_id",
          userId: userId,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$userId", "$$userId"]
              }
            }
          },
          {
            $project: {
              _id: 0,
              isWishlisted: {
                $in: ["$$productId", "$productIds"]
              }
            }
          }
        ],
        as: "wishlist"
      }
    },
    {
      $addFields: {
        isWishlisted: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: "$wishlist"
                },
                0
              ]
            },
            then: {
              $arrayElemAt: [
                "$wishlist.isWishlisted",
                0
              ]
            },
            else: false
          }
        }
      }
    },
    {
      $project: {
        wishlist: 0,
        "offerDetails.productIds": 0,
        "offerDetails.categoryIds": 0,
        "offerDetails.subcategoryIds": 0,
        "offerDetails.isDisabled": 0,
        "offerDetails.createdAt": 0,
        "offerDetails.updatedAt": 0
      }
    },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit }
  ])
  return products
}




module.exports = {
  getProductsAggregation
}