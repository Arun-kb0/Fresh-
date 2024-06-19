const CustomError = require("../../constants/CustomError")
const { BAD_REQUEST, OK } = require("../../constants/httpStatusCodes")
const productModel = require("../../model/prodctModel")
const subCategoryModel = require("../../model/subCategoryModel")


// * get product list page
const getProductController = async (req, res, next) => {
  try {
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
      }
    ]).skip(0).limit(10).sort({ rating: 1, name: 1 })

    // res.status(OK).json({ products })
    res.render('admin/products/productsTable', { isAuthPage: false, products: products })
  } catch (error) {
    next(error)
  }
}

// * edit
const getEditProductController = async (req, res, next) => {
  const { product } = req.query
  try {
    console.log(product)
    if (!product) {
      const message = 'product required for editing'
      throw new CustomError(message, BAD_REQUEST)
    }
    const data = JSON.parse(product)
    res.render('admin/products/editProduct', { isEdit: true, isAuthPage: false, product: data })
  } catch (error) {
    next(error)
  }
}

const editProductController = async (req, res, next) => {
  let product = req.body
  try {
   
    const { name, subCategory, subCategoryId, id, price, finalPrice, rating, peopleRated, stock, ...rest } = product
    const categoryId = subCategoryId
    const _id = id

    product = {
      _id,
      name,
      categoryId,
      price: parseFloat(price),
      finalPrice: parseFloat(finalPrice),
      rating: parseInt(rating),
      peopleRated: parseInt(peopleRated),
      stock: parseInt(stock),
      productInfo: {
        ...rest
      }
    }
    console.log(product)

    const cleanObject = (obj) => {
      let cleanedObj = {};
      for (const [key, val] of Object.entries(obj)) {
        if (val !== null && val !== undefined && val !== '') {
          if (typeof val === 'object' && !Array.isArray(val)) {
            const cleanedNestedObj = cleanObject(val);
            if (Object.keys(cleanedNestedObj).length > 0) {
              cleanedObj[key] = cleanedNestedObj;
            }
          } else {
            cleanedObj[key] = val;
          }
        }
      }
      return cleanedObj;
    };

    const cleanedProduct = cleanObject(product);
    console.log(cleanedProduct);


    if (product.price < product.finalPrice) {
      const message = "final price must be less than price"
      throw new CustomError(message, BAD_REQUEST)
    }
    isProductExists = await productModel.findOne({ _id })
    if (!isProductExists) {
      const message = "no product found"
      throw new CustomError(message, BAD_REQUEST)
    }
    isCategoryExists = await subCategoryModel.findOne({ _id: categoryId })
    if (!isCategoryExists) {
      const message = "category with give id doesn't exists"
      throw new CustomError(message, BAD_REQUEST)
    }
    const editedProduct = await productModel.findOneAndUpdate(
      { _id },
      { ...product },
      { new: true }
    )
    res.status(OK).json({ message: "product updated", product: editedProduct })
  } catch (error) {
    next(error)
  }
}

// * create
const getCreateProductController = async (req, res) => {
  try {
    res.render('admin/products/editProduct', { isEdit: false, isAuthPage: false })
  } catch (error) {
    next(error)
  }
}

const createProductController = async (req, res, next) => {
  let product = req.body
  try {
    console.log(product)
    const { name, subCategory, subCategoryId, id, price, finalPrice, rating, peopleRated, stock, ...rest } = product
    const categoryId = subCategoryId
    product = {
      name,
      categoryId,
      price: parseFloat(price),
      finalPrice: parseFloat(finalPrice),
      rating: parseInt(rating),
      peopleRated: parseInt(peopleRated),
      stock: parseInt(stock),
      productInfo: {
        ...rest
      }
    }

    isCategoryExists = await subCategoryModel.findOne({ _id: categoryId })
    if (!isCategoryExists) {
      const message = "category with give id doesn't exists"
      throw new CustomError(message, BAD_REQUEST)
    }
    const newProduct = await productModel.create(product)
    res.status(OK).json({ message: "new product created", product: newProduct })
  } catch (error) {
    next(error)
  }
}


// * delete
const deleteProductController = async (req, res, next) => {
  const { productId } = req.query
  try {
    isProductExists = await productModel.findOne({ _id: productId })
    if (!isProductExists) {
      const message = "no product found"
      throw new CustomError(message, BAD_REQUEST)
    }
    const deletedProduct = await productModel.findOneAndUpdate(
      { _id: productId },
      { isDeleted: true },
      { new: true }
    )
    res.status(OK).json({ message: `product ${deletedProduct.name} deleted` })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getProductController,
  getEditProductController,
  getCreateProductController,
  createProductController,
  editProductController,
  deleteProductController
}