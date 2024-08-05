const cartModel = require("../model/cartModel")
const orderModel = require("../model/orderModel")
const productModel = require("../model/productModel")
const walletModel = require("../model/walletModel")


const getProductsAggregation = async ({ sort, skip, limit, userId = '' }) => {
  console.log("userId ", userId)
  // * aggregation after adding offer products column
  const products = await productModel.aggregate([
    {
      $match: {
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: "wishlists",
        let: {
          productId: "$_id",
          userId: userId
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
      }
    },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit }
  ])
  return products
}


// * orders with all orderStatus
// const getSalesReportAggregation = async ({ startDate, endDate, sort, skip, limit }) => {
//   const report = await orderModel.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $gte: startDate,
//           $lt: endDate,
//         }
//       }
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "userId",
//         foreignField: "userId",
//         as: "user"
//       }
//     },
//     {
//       $lookup: {
//         from: "addresses",
//         localField: "addressId",
//         foreignField: "_id",
//         as: "address"
//       }
//     },
//     {
//       $unwind: "$products"
//     },
//     {
//       $lookup: {
//         from: "products",
//         localField: "products.productId",
//         foreignField: "_id",
//         as: "productDetails"
//       }
//     },
//     {
//       $unwind: "$productDetails"
//     },
//     {
//       $lookup: {
//         from: "subcategories",
//         localField: "productDetails.categoryId",
//         foreignField: "_id",
//         as: "subcategory"
//       }
//     },
//     {
//       $lookup: {
//         from: "categories",
//         localField: "subcategory.parentId",
//         foreignField: "_id",
//         as: "category"
//       }
//     },
//     {
//       $addFields: {
//         "products.category": {
//           $arrayElemAt: ["$category.name", 0]
//         },
//         "products.subcategory": {
//           $arrayElemAt: ["$subcategory.name", 0]
//         },
//         "products.productDetails": "$productDetails"
//       }
//     },
//     {
//       $group: {
//         _id: {
//           _id: "$_id",
//           userId: "$userId",
//           addressId: "$addressId",
//           orderStatus: "$orderStatus",
//           coupon: "$coupon",
//           total: "$total",
//           paymentMethod: "$paymentMethod",
//           paymentStatus: "$paymentStatus",
//           createdAt: "$createdAt",
//           updatedAt: "$updatedAt",
//           userDetails: {
//             $arrayElemAt: ["$user", 0]
//           },
//           addressDetails: {
//             $arrayElemAt: ["$address", 0]
//           }
//         },
//         products: {
//           $push: "$products"
//         }
//       }
//     },
//     {
//       $project: {
//         _id: "$_id._id",
//         userId: "$_id.userId",
//         addressId: "$_id.addressId",
//         orderStatus: "$_id.orderStatus",
//         coupon: "$_id.coupon",
//         total: "$_id.total",
//         paymentMethod: "$_id.paymentMethod",
//         paymentStatus: "$_id.paymentStatus",
//         createdAt: "$_id.createdAt",
//         updatedAt: "$_id.updatedAt",
//         userDetails: "$_id.userDetails",
//         addressDetails: "$_id.addressDetails",
//         products: 1
//       }
//     },
//     {
//       $addFields: {
//         products: {
//           $map: {
//             input: "$products",
//             as: "product",
//             in: {
//               $mergeObjects: [
//                 "$$product",
//                 // Keep all existing fields in the product
//                 {
//                   maxPrice: {
//                     $multiply: [
//                       "$$product.productDetails.price",
//                       "$$product.quantity"
//                     ]
//                   }
//                 }
//               ]
//             }
//           }
//         }
//       }
//     },
//     {
//       $addFields: {
//         maxTotal: {
//           $sum: {
//             $map: {
//               input: "$products",
//               as: "product",
//               in: "$$product.maxPrice"
//             }
//           }
//         }
//       }
//     },
//     {
//       $addFields: {
//         discountAmount: {
//           $subtract: ["$maxTotal", "$total"]
//         }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: {
//           $sum: "$total"
//         },
//         maxTotalAmount: {
//           $sum: "$maxTotal"
//         },
//         totalDiscountAmount: {
//           $sum: "$discountAmount"
//         },
//         totalOrders: {
//           $sum: 1
//         },
//         totalPendingOrders: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$orderStatus", "Pending"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalSuccessedOrders: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$orderStatus", "Delivered"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalCancelledOrders: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$orderStatus", "Cancelled"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalReturnedOrders: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$orderStatus", "Returned"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalCodPayments: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$paymentMethod", "cod"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalOnlinePayments: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$paymentMethod", "online"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalCompletedPayments: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$paymentStatus", "Completed"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalFailedPayments: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$paymentStatus", "Failed"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         totalPendingPayments: {
//           $sum: {
//             $cond: [
//               {
//                 $eq: ["$paymentStatus", "Pending"]
//               },
//               1,
//               0
//             ]
//           }
//         },
//         docs: {
//           $push: "$$ROOT"
//         }
//       }
//     },
//     { $sort: sort },
//     { $skip: skip },
//     { $limit: limit }
//   ])
//   return report
// }

// * orders with all orderStatus= 'delivered'
const getSalesReportAggregation = async ({ startDate, endDate, sort, skip, limit }) => {
  const report = await orderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "userId",
        as: "user"
      }
    },
    {
      $lookup: {
        from: "addresses",
        localField: "addressId",
        foreignField: "_id",
        as: "address"
      }
    },
    {
      $unwind: "$products"
    },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "productDetails.categoryId",
        foreignField: "_id",
        as: "subcategory"
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "subcategory.parentId",
        foreignField: "_id",
        as: "category"
      }
    },
    {
      $addFields: {
        "products.category": {
          $arrayElemAt: ["$category.name", 0]
        },
        "products.subcategory": {
          $arrayElemAt: ["$subcategory.name", 0]
        },
        "products.productDetails": "$productDetails"
      }
    },
    {
      $group: {
        _id: {
          _id: "$_id",
          userId: "$userId",
          addressId: "$addressId",
          orderStatus: "$orderStatus",
          coupon: "$coupon",
          total: "$total",
          paymentMethod: "$paymentMethod",
          paymentStatus: "$paymentStatus",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          userDetails: {
            $arrayElemAt: ["$user", 0]
          },
          addressDetails: {
            $arrayElemAt: ["$address", 0]
          }
        },
        products: {
          $push: "$products"
        }
      }
    },
    {
      $match: {
        "_id.orderStatus": "Delivered"
      }
    },
    {
      $project: {
        _id: "$_id._id",
        userId: "$_id.userId",
        addressId: "$_id.addressId",
        orderStatus: "$_id.orderStatus",
        coupon: "$_id.coupon",
        total: "$_id.total",
        paymentMethod: "$_id.paymentMethod",
        paymentStatus: "$_id.paymentStatus",
        createdAt: "$_id.createdAt",
        updatedAt: "$_id.updatedAt",
        userDetails: "$_id.userDetails",
        addressDetails: "$_id.addressDetails",
        products: 1
      }
    },
    {
      $addFields: {
        products: {
          $map: {
            input: "$products",
            as: "product",
            in: {
              $mergeObjects: [
                "$$product",
                // Keep all existing fields in the product
                {
                  maxPrice: {
                    $multiply: [
                      "$$product.productDetails.price",
                      "$$product.quantity"
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        maxTotal: {
          $sum: {
            $map: {
              input: "$products",
              as: "product",
              in: "$$product.maxPrice"
            }
          }
        }
      }
    },
    {
      $addFields: {
        discountAmount: {
          $subtract: ["$maxTotal", "$total"]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: "$total"
        },
        maxTotalAmount: {
          $sum: "$maxTotal"
        },
        totalDiscountAmount: {
          $sum: "$discountAmount"
        },
        totalOrders: {
          $sum: 1
        },
        totalPendingOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "Pending"]
              },
              1,
              0
            ]
          }
        },
        totalSuccessedOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "Delivered"]
              },
              1,
              0
            ]
          }
        },
        totalCancelledOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "Cancelled"]
              },
              1,
              0
            ]
          }
        },
        totalReturnedOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "Returned"]
              },
              1,
              0
            ]
          }
        },
        totalCodPayments: {
          $sum: {
            $cond: [
              {
                $eq: ["$paymentMethod", "cod"]
              },
              1,
              0
            ]
          }
        },
        totalOnlinePayments: {
          $sum: {
            $cond: [
              {
                $eq: ["$paymentMethod", "online"]
              },
              1,
              0
            ]
          }
        },
        totalCompletedPayments: {
          $sum: {
            $cond: [
              {
                $eq: ["$paymentStatus", "Completed"]
              },
              1,
              0
            ]
          }
        },
        totalFailedPayments: {
          $sum: {
            $cond: [
              {
                $eq: ["$paymentStatus", "Failed"]
              },
              1,
              0
            ]
          }
        },
        totalPendingPayments: {
          $sum: {
            $cond: [
              {
                $eq: ["$paymentStatus", "Pending"]
              },
              1,
              0
            ]
          }
        },
        docs: {
          $push: "$$ROOT"
        }
      }
    },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit }
  ])

  return report
}


const getWalletWithSortedTransactionsAggregation = async ({ userId, skip=0, limit=10 }) => {
  const wallet = await walletModel.aggregate([
    { $match: { userId: userId } },
    { $unwind: "$transactions" },
    { $sort: { "transactions.date": -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        balance: { $first: "$balance" },
        transactions: { $push: "$transactions" }
      }
    }
  ]);

  return wallet[0];
}

const getCartWithDetailsAggregation = async ({ userId, deliveryFee }) => {
  const result = await cartModel.aggregate([
    {
      $match: {
        userId: userId
      }
    },
    {
      $unwind: "$products"
    },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $project: {
        _id: 1,
        "products.productId": 1,
        "products.quantity": 1,
        "products.price": 1,
        productName: "$productDetails.name",
        image: "$productDetails.image.path",
        // Extract single image path
        soldBy:
          "$productDetails.productInfo.soldBy",
        // Extract soldBy
        stock: "$productDetails.stock",
        productTotalPrice: "$products.price",
        totalPrice: "$total"
      }
    },
    {
      $group: {
        _id: "$_id",
        products: {
          $push: {
            productId: "$products.productId",
            name: "$productName",
            quantity: "$products.quantity",
            price: "$products.price",
            image: "$image",
            soldBy: "$soldBy",
            stock: "$stock"
          }
        },
        totalItems: {
          $sum: 1
        },
        totalQuantity: {
          $sum: "$products.quantity"
        },
        totalPrice: {
          $first: "$totalPrice"
        }
      }
    },
    {
      $addFields: {
        totalItems: "$totalItems",
        totalQuantity: "$totalQuantity",
        subTotalPrice: "$totalPrice",
        deliveryFee: deliveryFee,
        totalPrice: "$totalPrice"
      }
    }
  ])
  return (result && result.length > 0) ? result[0] : null
}

const cartCheckoutAggregation = async ({ userId }) => {
  const result = await cartModel.aggregate([
    {
      $match: {
        userId: userId
      }
    },
    {
      $unwind: "$products"
    },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        coupon: 1,
        "products.quantity": 1,
        "products.productId": 1,
        productName: "$productDetails.name",
        image: {
          $arrayElemAt: [
            "$productDetails.image.path",
            0
          ]
        },
        soldBy:
          "$productDetails.productInfo.soldBy",
        stock: "$productDetails.stock",
        productTotalPrice: "$products.price",
        total: "$total"
      }
    },
    {
      $group: {
        _id: "$_id",
        userId: {
          $first: "$userId"
        },
        appliedCoupon: {
          $first: "$coupon"
        },
        products: {
          $push: {
            productId: "$products.productId",
            name: "$productName",
            quantity: "$products.quantity",
            price: "$products.price",
            image: "$image",
            soldBy: "$soldBy",
            stock: "$stock"
          }
        },
        totalItems: {
          $sum: 1
        },
        totalQuantity: {
          $sum: "$products.quantity"
        },
        subTotalPrice: {
          $sum: "$productTotalPrice"
        },
        totalPrice: {
          $first: "$total"
        }
      }
    },
    {
      $lookup: {
        from: "addresses",
        localField: "userId",
        foreignField: "userId",
        as: "addresses"
      }
    },
    {
      $lookup: {
        from: "usedcoupons",
        localField: "userId",
        foreignField: "userId",
        as: "usedcoupons"
      }
    },
    {
      $lookup: {
        from: "coupons",
        let: {
          usedCoupons: "$usedcoupons"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $not: {
                  $in: [
                    "$_id",
                    {
                      $reduce: {
                        input: "$$usedCoupons",
                        initialValue: [],
                        in: {
                          $setUnion: [
                            "$$value",
                            "$$this.coupons"
                          ]
                        }
                      }
                    }
                  ]
                }
              },
              isDeleted: false // adding not deleted 
            }
          }
        ],
        as: "unusedCoupons"
      }
    },
    {
      $lookup: {
        from: "coupons",
        localField: "appliedCoupon",
        foreignField: "code",
        as: "appliedCouponDetails"
      }
    },
    {
      $project: {
        totalItems: 1,
        totalQuantity: 1,
        subTotalPrice: 1,
        deliveryFee: 1,
        totalPrice: 1,
        unusedCoupons: 1,
        appliedCouponDetails: {
          $arrayElemAt: ["$appliedCouponDetails", 0]
        },
        addresses: {
          $filter: {
            input: "$addresses",
            as: "address",
            cond: {
              $eq: ["$$address.isDeleted", false]
            }
          }
        }
      }
    }
  ])
  return (result && result.length > 0) ? result[0] : null
}


const getOrderDetailsAggregation = async ({ orderId }) => {
  const result = await orderModel.aggregate([
    {
      $match: {
        _id: orderId
      }
    },
    {
      $lookup: {
        from: 'addresses',
        localField: 'addressId',
        foreignField: '_id',
        as: 'addressDetails'
      }
    },
    {
      $unwind: '$addressDetails'
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'products', // Collection name of products
        localField: 'products.productId',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $set: {
        'products.name': { $arrayElemAt: ['$productDetails.name', 0] },
        'products.image': { $arrayElemAt: ['$productDetails.image', 0] },
        'products.finalPrice': { $arrayElemAt: ['$productDetails.finalPrice', 0] },
        "products.soldBy": { $arrayElemAt: ["$productDetails.productInfo.soldBy", 0] }
      }
    },
    {
      $unset: 'productDetails'
    },
    {
      $group: {
        _id: '$_id',
        userId: { $first: '$userId' },
        addressId: { $first: '$addressId' },
        addressDetails: { $first: '$addressDetails' }, // Include full address details
        orderStatus: { $first: '$orderStatus' },
        total: { $first: '$total' },
        paymentMethod: { $first: '$paymentMethod' },
        coupon: { $first: '$coupon' },
        paymentStatus: { $first: '$paymentStatus' },
        products: { $push: '$products' },
        createdAt: { $first: '$createdAt' }
      }
    }
  ]);
  return result ? result[0] : null
}



module.exports = {
  getProductsAggregation,
  getSalesReportAggregation,
  getWalletWithSortedTransactionsAggregation,
  getCartWithDetailsAggregation,
  cartCheckoutAggregation,
  getOrderDetailsAggregation
}