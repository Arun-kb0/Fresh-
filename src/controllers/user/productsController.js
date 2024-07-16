const CustomError = require("../../constants/CustomError")
const { NO_CONTENT, OK, NOT_FOUND } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const productModel = require('../../model/productModel')
const categoryModel = require('../../model/categoryModel')
const subcategoryModel = require('../../model/subCategoryModel')
const { default: mongoose } = require("mongoose")


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
  const { page = 1, categoryId, subcategoryId, sortValue } = req.query
  console.log(sortValue)

  try {
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await productModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)



    const categories = await categoryModel.find({ isDeleted: false })
    const subcategories = await subcategoryModel.find({ isDeleted: false })

    const getSortQueryField = (idName, fieldName) => {
      switch (idName) {
        case 'categoryId':
          return `products.${fieldName}`
        default:
          return fieldName
      }
    }

    let sortQuery = ''
    let fieldName = ''
    switch (sortValue) {
      case 'aToz':
        if (categoryId) {
          fieldName = getSortQueryField('categoryId', 'lowercaseName')
        } else {
          fieldName = getSortQueryField('', 'name')
        }
        sortQuery = { [fieldName]: 1 }
        break;
      case 'price':
        if (categoryId) {
          fieldName = getSortQueryField('categoryId', 'finalPrice')
        } else {
          fieldName = getSortQueryField('', 'finalPrice')
        }
        sortQuery = { [fieldName]: 1 }
        break;
      case 'priceHighToLow':
        if (categoryId) {
          fieldName = getSortQueryField('categoryId', 'finalPrice')
        } else {
          fieldName = getSortQueryField('', 'finalPrice')
        }
        sortQuery = { [fieldName]: -1 }
        break;
      case 'rating':
        if (categoryId) {
          fieldName = getSortQueryField('categoryId', 'rating')
        } else {
          fieldName = getSortQueryField('', 'rating')
        }
        sortQuery = { [fieldName]: -1 }
        break;
      case 'newArrivals':
        if (categoryId) {
          fieldName = getSortQueryField('categoryId', 'createdAt')
        } else {
          fieldName = getSortQueryField('', 'createdAt')
        }
        sortQuery = { [fieldName]: 1 }
        break;
      case 'popularity':
        if (categoryId) {
          fieldName = getSortQueryField('categoryId', 'peopleRated')
        } else {
          fieldName = getSortQueryField('', 'peopleRated')
        }
        sortQuery = { [fieldName]: -1 }
        break
      default:
        if (categoryId) {
          fieldName = getSortQueryField('categoryId', 'lowercaseName')
        } else {
          fieldName = getSortQueryField('', 'name')
        }
        sortQuery = { [fieldName]: 1 }
        break;
    }
    console.log(sortQuery)

    const handleEmptyData = async () => {
      products = await productModel.find({ isDeleted: false })
        .sort(sortQuery).skip(startIndex).limit(LIMIT)
      res.render('user/products/products', {
        ...viewUsersPage,
        isSearchPage: false,
        products,
        categories,
        subcategories,
        title,
        page: Number(page),
        numberOfPages
      })
    }

    let title = 'All categories'
    let products
    if (categoryId) {
      const categoryObjId = mongoose.Types.ObjectId.createFromHexString(categoryId)
      const result = await categoryModel.aggregate(
        [
          {
            $match: {
              isDeleted: false,
              _id: categoryObjId
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
            $unwind: "$subcategories"
          },
          {
            $lookup: {
              from: "products",
              localField: "subcategories._id",
              foreignField: "categoryId",
              as: "products"
            }
          },
          {
            $unwind: "$products"
          },
          {
            $addFields: {
              "products.lowercaseName": {
                $toLower: "$products.name"
              }
            }
          },
          // { $sort: { "products.lowercaseName": 1 } },
          { $sort: sortQuery },
          {
            $group: {
              _id: "$_id",
              image: {
                $first: "$image"
              },
              name: {
                $first: "$name"
              },
              allProducts: {
                $push: "$products"
              }
            }
          }
        ])
      if (!result || result.length === 0) {
        handleEmptyData()
        return
      }
      title = result?.[0].name
      products = result[0].allProducts
    } else if (subcategoryId) {
      const subcategoryObjId = mongoose.Types.ObjectId.createFromHexString(subcategoryId)
      products = await productModel.aggregate([
        {
          $match: {
            isDeleted: false,
            categoryId: subcategoryObjId
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
            subcategory: { $arrayElemAt: ["$subcategory", 0] }
          }
        },
        { $sort: sortQuery },
        { $skip: startIndex },
        { $limit: LIMIT }
      ])
      if (!products || products.length === 0) {
        handleEmptyData()
        return
      }
      title = products?.[0].subcategory.name

    } else {
      handleEmptyData()
      return
    }


    res.render('user/products/products', {
      ...viewUsersPage,
      isSearchPage: false,
      products,
      categories,
      subcategories,
      title,
      page: Number(page),
      numberOfPages
    })
  } catch (error) {
    next(error)
  }
}


const getProductSearchResultController = async (req, res, next) => {
  const { searchQuery } = req.query
  try {
    const products = await productModel.find({
      $text: { $search: searchQuery }
    })
      .select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);

    const categories = await categoryModel.find({ isDeleted: false })
    const subcategories = await subcategoryModel.find({ isDeleted: false })

    res.render('user/products/products', {
      ...viewUsersPage,
      isSearchPage: true,
      products,
      categories,
      subcategories,
      title: 'search',
      page: 1,
      numberOfPages: 2
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
  getProductsProductsPageController,
  getProductSearchResultController
}