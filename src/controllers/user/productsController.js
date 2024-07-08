const CustomError = require("../../constants/CustomError")
const { NO_CONTENT, OK } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const productModel = require('../../model/productModel')


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

    const topBrandProducts = await productModel.find({ isDeleted: false })
      .sort({ "productInfo.brand": -1 }).skip(startIndex).limit(LIMIT)

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

    const popularProducts = await productModel.find({ isDeleted: false })
      .sort({ peopleRated: -1 }).skip(startIndex).limit(LIMIT)

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

    const topRatedProducts = await productModel.find({ isDeleted: false })
      .sort({ rating: -1 }).skip(startIndex).limit(LIMIT)

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

    const newProducts = await productModel.find({ isDeleted: false })
      .sort({ createdAt : -1 }).skip(startIndex).limit(LIMIT)

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





module.exports = {
  getProductsController,
  getSingleProductController,
  getTopBrandsProductsController,
  getPopularProductsController,
  getTopRatedProductsController,
  getNewProductsController
}