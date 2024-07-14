const CustomError = require("../../constants/CustomError")
const { NO_CONTENT, OK } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const productModel = require('../../model/productModel')
const categoryModel = require('../../model/categoryModel')
const subcategoryModel = require('../../model/subCategoryModel')


const getProductsAggregation = async ({ sort, skip, limit }) => {
  const products = await productModel.aggregate([
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: "offers",
        localField: "_id",
        foreignField: "productIds",
        as: "offerDetails"
      }
    },
    {
      $unwind: "$offerDetails"
    },
    {
      $project: {
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

const getProductsController = async (req, res, next) => {
  try {


    res.render('user/home/home2', {
      ...viewUsersPage,
    })

  } catch (error) {
    next(error)
  }
}



const getTopBrandsProductsController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    if (page > numberOfPages) {
      throw new CustomError('page end', NO_CONTENT)
    }

    // const topBrandProducts = await productModel.aggregate([
    //   { $match: { isDeleted: false } },
    //   {
    //     $lookup: {
    //       from: "offers",
    //       localField: "_id",
    //       foreignField: "productIds",
    //       as: "offerDetails"
    //     }
    //   },
    //   {
    //     $unwind: "$offerDetails"
    //   },
    //   {
    //     $project: {
    //       "offerDetails.productIds": 0,
    //       "offerDetails.categoryIds": 0,
    //       "offerDetails.subcategoryIds": 0,
    //       "offerDetails.isDisabled": 0,
    //       "offerDetails.createdAt": 0,
    //       "offerDetails.updatedAt": 0
    //     }
    //   },
    //   { $sort: { "productInfo.brand": 1 } },
    //   { $skip: startIndex },
    //   { $limit: LIMIT }
    // ])

    const topBrandProducts = await getProductsAggregation({
      sort: { "productInfo.brand": 1 },
      skip: startIndex,
      limit: LIMIT,
    })



    res.status(OK).json({
      products: topBrandProducts,
      page: Number(page),
      numberOfPages,
    })
  } catch (error) {
    next(error)
  }
}

const getPopularProductsController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    if (page > numberOfPages) {
      throw new CustomError('page end', NO_CONTENT)
    }

    // const popularProducts = await productModel.find({ isDeleted: false })
    //   .sort({ peopleRated: -1 }).skip(startIndex).limit(LIMIT)

    const popularProducts = await getProductsAggregation({
      sort: { peopleRated: -1 },
      skip: startIndex,
      limit: LIMIT
    })

    res.status(OK).json({
      products: popularProducts,
      page: Number(page),
      numberOfPages,
    })
  } catch (error) {
    next(error)
  }
}

const getTopRatedProductsController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    if (page > numberOfPages) {
      throw new CustomError('page end', NO_CONTENT)
    }

    // const topRatedProducts = await productModel.find({ isDeleted: false })
    //   .sort({ rating: -1 }).skip(startIndex).limit(LIMIT)

    const topRatedProducts = await getProductsAggregation({
      sort: { rating: -1 },
      skip: startIndex,
      limit: LIMIT,
    })

    res.status(OK).json({
      products: topRatedProducts,
      page: Number(page),
      numberOfPages,
    })
  } catch (error) {
    next(error)
  }
}

const getNewProductsController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    if (page > numberOfPages) {
      throw new CustomError('page end', NO_CONTENT)
    }


    const newProducts = await getProductsAggregation({
      sort: { createdAt: -1 },
      skip: startIndex,
      limit: LIMIT,
    })

    console.log("topBrandProducts[0].length ")
    console.log(newProducts.length)

    res.status(OK).json({
      products: newProducts,
      page: Number(page),
      numberOfPages,
    })
  } catch (error) {
    next(error)
  }
}



const getSingleProductController = async (req, res, next) => {
  const { productId } = req.query
  console.log(productId)
  try {
    const product = await productModel.findOne({ _id: productId, isDeleted: false })
    const suggestions = await productModel.find({ isDeleted: false })
    console.log(product)
    res.render('user/products/singleProduct', { ...viewUsersPage, product, suggestions })
  } catch (error) {
    next(error)
  }
}


const getProductsProductsPageController = async (req, res, next) => {
  const { page = 1 } = req.body
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)


    const products = await productModel.find({ isDeleted: false })
      .sort().skip(startIndex).limit(LIMIT)

    const categories = await categoryModel.find({ isDeleted: false })
    const subcategories = await subcategoryModel.find({ isDeleted: false })

    res.render('user/products/products', {
      ...viewUsersPage,
      products,
      categories,
      subcategories,
      page: Number(page),
      numberOfPages
    })
  } catch (error) {
    next(error)
  }
}




module.exports = {
  getProductsController,
  getSingleProductController,
  getTopBrandsProductsController,
  getPopularProductsController,
  getTopRatedProductsController,
  getNewProductsController,
  getProductsProductsPageController
}