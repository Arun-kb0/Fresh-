const { OK } = require("../../constants/httpStatusCodes");
const { viewAdminPage } = require("../../constants/pageConfid");
const categoryModel = require("../../model/categoryModel");
const orderModel = require("../../model/orderModel");
const productModel = require("../../model/productModel");
const userModel = require("../../model/userModel")

const getTotalPerMonth = async ({ model }) => {
  try {
    const result = await model.aggregate([
      {
        // Group users by the year and month they were created
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        // Sort the result by year and month
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      },
      {
        // Group all monthly counts into an array
        $group: {
          _id: "$_id.year",
          months: {
            $push: {
              month: "$_id.month",
              count: "$count"
            }
          }
        }
      },
      {
        // Sort the result by year (optional, depending on your requirements)
        $sort: {
          "_id": 1
        }
      }
    ]);

    const totalProducts = new Array(12).fill(0);

    if (result.length > 0) {
      result[0].months.forEach(monthData => {
        totalProducts[monthData.month - 1] = monthData.count;
      });
    }
    return totalProducts
  } catch (error) {
    throw error
  }
}

const getOrdersPerCategories = async ({ startDate, endDate }) => {


  try {
    const result = await categoryModel.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "parentId",
          as: "subcategories"
        }
      },
      {
        $project: {
          categoryName: "$name",
          categoryId: "$_id",
          subcategoryIds: "$subcategories._id"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "subcategoryIds",
          foreignField: "categoryId",
          as: "products"
        }
      },
      {
        $project: {
          categoryName: 1,
          categoryId: 1,
          subcategoryIds: 1,
          productIds: "$products._id"
        }
      },
      {
        $lookup: {
          from: "orders",
          let: {
            productIds: "$productIds"
          },
          pipeline: [
            {
              $unwind: "$products"
            },
            {
              $match: {
                createdAt: {
                  $gte: startDate,
                  $lt: endDate
                },
                $expr: {
                  $in: [
                    "$products.productId",
                    "$$productIds"
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                orderCount: {
                  $sum: 1
                }
              }
            }
          ],
          as: "orderInfo"
        }
      },
      {
        $unwind: {
          path: "$orderInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          categoryName: 1,
          categoryId: 1,
          subcategoryIds: 1,
          productIds: 1,
          orderCount: {
            $ifNull: ["$orderInfo.orderCount", 0]
          }
        }
      }
    ])

    // console.log("result")
    // console.log(result)
    const categoryNames = []
    const orderCounts = []
    if (!result) {
      return {
        categoryNames: [],
        orderCounts: []
      }
    }

    for (const item of result) {
      categoryNames.push(item.categoryName)
      orderCounts.push(item.orderCount)
    }

    return { categoryNames, orderCounts }
  } catch (error) {
    throw error
  }
}

const getTopSalesInCategories = async () => {
  const result = await categoryModel.aggregate([
    {
      $match: {
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "_id",
        foreignField: "parentId",
        as: "subcategories"
      }
    },
    {
      $project: {
        categoryName: "$name",
        image: "$image",
        categoryId: "$_id",
        subcategoryIds: "$subcategories._id"
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "subcategoryIds",
        foreignField: "categoryId",
        as: "products"
      }
    },
    {
      $project: {
        categoryName: 1,
        categoryId: 1,
        image: 1,
        subcategoryIds: 1,
        productIds: "$products._id"
      }
    },
    {
      $lookup: {
        from: "orders",
        let: {
          productIds: "$productIds"
        },
        pipeline: [
          {
            $unwind: "$products"
          },
          {
            $match: {
              $expr: {
                $in: [
                  "$products.productId",
                  "$$productIds"
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              orderCount: {
                $sum: 1
              }
            }
          }
        ],
        as: "orderInfo"
      }
    },
    {
      $unwind: {
        path: "$orderInfo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        categoryName: 1,
        categoryId: 1,
        image: 1,
        orderCount: {
          $ifNull: ["$orderInfo.orderCount", 0]
        }
      }
    },
    {
      $sort: {
        orderCount: -1
      }
    },
    {
      $limit: 10
    }
  ])
  return result ? result : []
}

const getTopSalesInProducts = async () => {
  const result = await orderModel.aggregate([
    {
      $unwind: "$products"
    },
    {
      $group: {
        _id: "$products.productId",
        totalQuantityOrdered: { $sum: "$products.quantity" }
      }
    },
    {
      $sort: {
        totalQuantityOrdered: -1
      }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $project: {
        productId: "$_id",
        productName: "$productDetails.name",
        totalQuantityOrdered: 1,
        images: "$productDetails.image",
      }
    }
  ]
  )
  return result ? result : []
}

const getTopSalesInBrands = async () => {
  const result = orderModel.aggregate([
    {
      $unwind: "$products"
    },
    {
      $group: {
        _id: "$products.productId",
        totalQuantityOrdered: { $sum: "$products.quantity" }
      }
    },
    {
      $sort: {
        totalQuantityOrdered: -1
      }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $group: {
        _id: "$productDetails.productInfo.brand",
        totalQuantityOrdered: { $sum: "$totalQuantityOrdered" },
        products: {
          $push: {
            productId: "$_id",
            productName: "$productDetails.name",
            images: "$productDetails.image",
            totalQuantityOrdered: "$totalQuantityOrdered"
          }
        }
      }
    },
    {
      $sort: {
        totalQuantityOrdered: -1
      }
    },
    {
      $limit: 10
    },
    {
      $project: {
        brand: "$_id",
        totalQuantityOrdered: 1,
      }
    }
  ])
  return result ? result : []
}

const getProfitAndPriceDetails = async () => {
  const result = await orderModel.aggregate([
    {
      $unwind: "$products"
    },
    {
      $group: {
        _id: "$_id",
        totalProductPrice: { $sum: "$products.price" },
        totalOrderPrice: { $first: "$total" },
        paymentStatus: { $first: "$paymentStatus" }
      }
    },
    {
      $group: {
        _id: null,
        totalProfit: { $sum: "$totalOrderPrice" },  
        totalTransactions: { $sum: "$totalProductPrice" },
        completedPaymentsCount: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "Completed"] }, 1, 0]
          }
        },
        pendingPaymentsCount: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "Pending"] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalProductCost: 1,
        totalTransactions: 1, 
        totalProfit: 1,
        completedPaymentsCount: 1,
        pendingPaymentsCount: 1
      }
    }
  ]
  )
  return  (result && result.length!==0) ? result[0] : []
}

const getAdminHomeController = async (req, res, next) => {
  const endDateDefault = new Date();
  const startDateDefault = new Date(endDateDefault);
  startDateDefault.setFullYear(startDateDefault.getFullYear() - 1);

  let { startDate, endDate } = req.query
  try {
    startDate = startDate ? new Date(startDate) : startDateDefault;
    endDate = endDate ? new Date(endDate) : endDateDefault;

    const totalProducts = await getTotalPerMonth({ model: productModel })
    const totalRegisters = await getTotalPerMonth({ model: userModel })
    const totalOrders = await getTotalPerMonth({ model: orderModel })

    const ordersPerCategories = await getOrdersPerCategories({
      startDate: startDate,
      endDate: endDate
    })
    // console.log(ordersPerCategories)

    // * getting best selling product , category , brands
    const topSalesInCategories = await getTopSalesInCategories()
    const topSalesInProducts = await getTopSalesInProducts()
    const topSalesInBrands = await getTopSalesInBrands()

    const profitDetails = await getProfitAndPriceDetails()

    res.render('admin/home/adminDashboard', {
      ...viewAdminPage,
      totalRegisters,
      totalProducts,
      totalOrders,
      ordersPerCategories,
      topSalesInCategories,
      topSalesInProducts,
      topSalesInBrands,
      profitDetails
    })
  } catch (error) {
    next(error)
  }
}

const getOrdersPerCategoryController = async (req, res, next) => {
  const { day, month, year } = req.query
  try {

    if (day) {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      startDate = new Date(currentYear, currentMonth, day)
      endDate = new Date(currentYear, currentMonth, day, 23, 59, 59, 999)
    } else if (month) {
      const startMonth = month - 1
      const currentYear = new Date().getFullYear()
      startDate = new Date(currentYear, startMonth, 1)
      endDate = new Date(currentYear, startMonth + 1, 0, 23, 59, 59, 999)
    } else if (year) {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    } else {
      const endDateDefault = new Date();
      const startDateDefault = new Date(endDateDefault);
      startDateDefault.setFullYear(startDateDefault.getFullYear() - 1);
      startDate = startDate ? new Date(startDate) : startDateDefault;
      endDate = endDate ? new Date(endDate) : endDateDefault;
    }

    console.log("startDate", startDate)
    console.log("endDate", endDate)
    console.log(month)

    const ordersPerCategories = await getOrdersPerCategories({
      startDate: startDate,
      endDate: endDate
    })

    res.status(OK).json({ message: 'get category wise order success ', ordersPerCategories })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminHomeController,
  getOrdersPerCategoryController
}