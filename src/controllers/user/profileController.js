const { viewUsersPage } = require("../../constants/pageConfid")
const productModel = require("../../model/productModel")


const getProfileController = async (req, res, next) => {
  const {page=1} = req.query
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
    res.render('user/profile/profile',{...viewUsersPage,suggestions:products} )
  } catch (error) {
    next(error)
  }
}

const getAddressController = async (req, res, next)=>{
  try {
    
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getProfileController,
  getAddressController
}