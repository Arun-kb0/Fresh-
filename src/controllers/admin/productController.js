const mongoose = require("mongoose")
const CustomError = require("../../constants/CustomError")
const { BAD_REQUEST, OK, NOT_FOUND, NOT_ACCEPTABLE, CONFLICT } = require("../../constants/httpStatusCodes")
const { viewAdminPage } = require("../../constants/pageConfid")
const { uploadImageToFirebase } = require("../../helpers/uploadImage")
const productModel = require("../../model/productModel")
const subCategoryModel = require("../../model/subCategoryModel")


// * get product list page
const getProductController = async (req, res, next) => {
  const { page = 1 } = req.query
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


    console.log("products array length ", products.length)
    
    res.render('admin/products/productsTable', {
      ...viewAdminPage,
      products: products,
      page: Number(page),
      numberOfPages,
    })
  } catch (error) {
    next(error)
  }
}

// * edit 
const getEditProductController = async (req, res, next) => {
  const { productId } = req.query
  console.log(productId)

  try {
    if (!productId) {
      const message = 'product required for editing'
      throw new CustomError(message, BAD_REQUEST)
    }
    const productObjectId = mongoose.Types.ObjectId.createFromHexString(productId)
    const product = await productModel.aggregate([
      {
        $match: {
          _id: productObjectId,
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
    ])
    const subCategory = await subCategoryModel.find({ isDeleted: false })
    res.render('admin/products/editProduct', { isEdit: true, ...viewAdminPage, product: product[0], subCategory })
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
    const files = req.files
    // console.log(files)

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
    cleanObject(product);
    product.stock = stock

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

    if ((isProductExists.image.length + files.length) > 5) {
      const message = "image count exceed"
      throw new CustomError(message, CONFLICT)
    }

    if (files) {
      images = []
      for (const file of files) {
        images.push(await uploadImageToFirebase(file, 'product'))
      }
      product.image = [...isProductExists.image, ...images]
      console.log(images)
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
const getCreateProductController = async (req, res,next) => {
  try {
    const subCategory = await subCategoryModel.find({ isDeleted: false })
    res.render('admin/products/editProduct', { isEdit: false, ...viewAdminPage, subCategory })
  } catch (error) {
    next(error)
  }
}

const createProductController = async (req, res, next) => {
  const { name, subCategory, subCategoryId, id, price, finalPrice, rating, peopleRated, stock, ...rest } = req.body
  try {
    console.log(req.files)
    // console.log(req.body.name)
    const categoryId = subCategoryId
    const files = req.files
    // console.log(name)
    if (!stock || !price || !finalPrice || !name) {
      const message = "name , stock , price , final price are required"
      throw new CustomError(message, BAD_REQUEST)
    }

    if (!files) {
      const message = "image required to create a product"
      throw new CustomError(message, BAD_REQUEST)
    }
    if (files.length <= 2) {
      const message = "minimum 3 images required to create a product"
      throw new CustomError(message, BAD_REQUEST)
    }
    if (!categoryId) {
      const message = "subcategory Id is required to crete a product"
      throw new CustomError(message, BAD_REQUEST)
    }
    isCategoryExists = await subCategoryModel.findOne({ _id: categoryId })
    if (!isCategoryExists) {
      const message = "category with give id doesn't exists"
      throw new CustomError(message, NOT_FOUND)
    }

    let images = []
    for (const file of files) {
      images.push(await uploadImageToFirebase(file, 'product'))
    }
    console.log(images)

    product = {
      image: images,
      name,
      categoryId,
      price: parseFloat(price),
      finalPrice: parseFloat(finalPrice),
      rating: rating ? parseInt(rating) : 0,
      peopleRated: peopleRated ? parseInt(peopleRated) : 0,
      stock: parseInt(stock),
      productInfo: {
        ...rest
      }
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


const deleteImageController = async (req, res, next) => {
  const { imageId } = req.query
  try {
    if (!imageId) throw new CustomError("invalid image id", BAD_REQUEST)

    const product = await productModel.findOne({ "image._id": imageId, isDeleted: false })
    if (product.image.length <= 3) {
      const message = "must have minimum 3 images"
      throw new CustomError(message, NOT_ACCEPTABLE)
    }
    const data = await productModel.updateOne(
      { isDeleted: false, "image._id": imageId },
      {
        $pull: {
          image: { _id: imageId }
        }
      }
    )
    console.log("data")
    console.log(data)
    res.status(OK).json({ message: "image deleted", data })
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
  deleteProductController,
  deleteImageController
}