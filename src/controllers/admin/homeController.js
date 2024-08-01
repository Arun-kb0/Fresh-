const { viewAdminPage } = require("../../constants/pageConfid");
const orderModel = require("../../model/orderModel");
const productModel = require("../../model/productModel");
const userModel = require("../../model/userModel")

const getTotalPerMonth = async({model}) => {
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

const getAdminHomeController = async (req, res) => {
  try {

    const totalProducts = await getTotalPerMonth({model:productModel})
    const totalRegisters = await getTotalPerMonth({ model: userModel })
    const totalOrders = await getTotalPerMonth({ model: orderModel })
  
    
    res.render('admin/home/adminDashboard', {
      ...viewAdminPage, 
      totalRegisters,
      totalProducts,
      totalOrders
    })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminHomeController
}