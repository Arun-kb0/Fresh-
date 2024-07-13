const CustomError = require("../constants/CustomError")
const { BAD_REQUEST, OK, NOT_FOUND, NO_CONTENT, CONFLICT } = require("../constants/httpStatusCodes")
const { viewAdminPage } = require("../constants/pageConfid")
const { uploadImageToFirebase } = require("../helpers/uploadImage")
const categoryModel = require("../model/categoryModel")
const offerModel = require("../model/offerModel")
const productModel = require("../model/productModel")
const subCategoryModel = require("../model/subCategoryModel")
const mongoose = require('mongoose')

const getAdminOffersTablePageController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await offerModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    const offers = await offerModel.find()

    res.render('admin/offer/offersTable', {
      ...viewAdminPage,
      offers,
      numberOfPages,
      page: Number(page)
    })
  } catch (error) {
    next(error)
  }
}

const getCreateOfferPageController = async (req, res, next) => {
  try {
    const categories = await categoryModel.find({ isDeleted: false }).select('_id name')
    const subcategories = await subCategoryModel.find({ isDeleted: false }).select('_id name')
    const products = await productModel.find({ isDeleted: false }).select('_id name')

    res.render('admin/offer/createOffer', {
      ...viewAdminPage,
      categories,
      subcategories,
      products
    })
  } catch (error) {
    next(error)
  }
}

const createOfferController = async (req, res, next) => {
  const offer = req.body
  const file = req.file
  console.log(offer)
  try {
    if (!file) {
      throw new CustomError('image required to create offer', BAD_REQUEST)
    }

    if (!offer.subcategory && !offer.category && !offer.product) {
      throw new CustomError('category , subcategory or product is required to create an offer', BAD_REQUEST)
    }
    const isOfferExists = await offerModel.findOne({ name: offer.name.toLowerCase() })
    if (isOfferExists) {
      throw new CustomError('offer name already exists', CONFLICT)
    }

    const subcategoryId = offer.subcategory
      ? mongoose.Types.ObjectId.createFromHexString(offer.subcategory)
      : null
    const categoryId = offer.category
      ? mongoose.Types.ObjectId.createFromHexString(offer.category)
      : null
    const productId = offer.product
      ? mongoose.Types.ObjectId.createFromHexString(offer.product)
      : null

    let productsIds = []
    if (categoryId) {
      const result = await categoryModel.aggregate([
        {
          $match: {
            _id: categoryId
          }
        },
        {
          $lookup: {
            from: "subcategories",
            localField: "_id",
            foreignField: "parentId",
            as: "subcategoryDetails"
          }
        },
        {
          $unwind: "$subcategoryDetails"
        },
        {
          $lookup: {
            from: "products",
            let: {
              categoryId: "$subcategoryDetails._id"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$categoryId",
                          "$$categoryId"
                        ]
                      },
                      {
                        $eq: ["$isDeleted", false]
                      }
                    ]
                  }
                }
              }
            ],
            as: "products"
          }
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: "$_id",
            productNames: {
              $push: "$products.name"
            },
            productIds: {
              $push: "$products._id"
            }
          }
        }
      ])
      productsIds = result[0]?.productIds
    } else if (subcategoryId) {
      const result = await subCategoryModel.aggregate([
        {
          $match: { _id: subcategoryId }
        },
        {
          $lookup: {
            from: "products",
            let: {
              categoryId: "$_id"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$categoryId",
                          "$$categoryId"
                        ]
                      },
                      {
                        $eq: ["$isDeleted", false]
                      }
                    ]
                  }
                }
              }
            ],
            as: "products"
          }
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: "$_id",
            productNames: {
              $push: "$products.name"
            },
            productIds: {
              $push: "$products._id"
            }
          }
        }
      ])
      productsIds = result[0]?.productIds
    } else if (productId) {
      productsIds = [productId]
    }

    console.log(productsIds)
    if (!productsIds ||  productsIds.length === 0) {
      throw new CustomError('no products found to apply offer', NOT_FOUND)
    }


    const image = await uploadImageToFirebase(file, 'offers')
    const newOffer = await offerModel.create({
      ...offer,
      image,
      categoryIds: categoryId ? [categoryId] : [],
      subcategoryIds: subcategoryId ? [subcategoryId] : [],
      productIds: productId ? [productId] : [],
    })

    const discountType = newOffer.discountType
    const discountValue = newOffer.discountValue

    const products = await productModel.find({ _id: { $in: productsIds } });
    const updatedProducts = products.map(product => {
      let finalPrice;

      if (discountType === 'percentage') {
        finalPrice = product.price - (product.price * (discountValue / 100));
      } else {
        finalPrice = product.price >= (discountValue * 2) ? product.price - discountValue : product.price;
      }

      return {
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { finalPrice } }
        }
      }
    })

    const updated = await productModel.bulkWrite(updatedProducts)
    console.log(updated)

    res.status(OK).json({ message: 'offer created', newOffer })
  } catch (error) {
    next(error)
  }
}

const deleteOfferController = async (req, res, next) => {
  const { offerId } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(offerId)) {
      throw new CustomError('invalid offerId', BAD_REQUEST)
    }
    const offer = await offerModel.findOne({ _id: offerId })
    if (!offer) {
      throw new CustomError('offer not found', NOT_FOUND)
    }
    const categoryIds = offer.categoryIds
    const subcategoryIds = offer.subcategoryIds
    let productsIds = offer.productIds

    if (categoryIds.length !== 0) {
      const result = await categoryModel.aggregate([
        {
          $match: {
            _id: { $in: categoryIds }
          }
        },
        {
          $lookup: {
            from: "subcategories",
            localField: "_id",
            foreignField: "parentId",
            as: "subcategoryDetails"
          }
        },
        {
          $unwind: "$subcategoryDetails"
        },
        {
          $lookup: {
            from: "products",
            let: {
              categoryId: "$subcategoryDetails._id"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$categoryId",
                          "$$categoryId"
                        ]
                      },
                      {
                        $eq: ["$isDeleted", false]
                      }
                    ]
                  }
                }
              }
            ],
            as: "products"
          }
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: "$_id",
            productNames: {
              $push: "$products.name"
            },
            productIds: {
              $push: "$products._id"
            }
          }
        }
      ])
      if (result && result[0] && result[0].productIds) {
        productsIds = [...productsIds, ...result[0].productIds];
      }
    }
    if (subcategoryIds.length !== 0) {
      const result = await subCategoryModel.aggregate([
        {
          $match: { _id: {$in : subcategoryIds} }
        },
        {
          $lookup: {
            from: "products",
            let: {
              categoryId: "$_id"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$categoryId",
                          "$$categoryId"
                        ]
                      },
                      {
                        $eq: ["$isDeleted", false]
                      }
                    ]
                  }
                }
              }
            ],
            as: "products"
          }
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: "$_id",
            productNames: {
              $push: "$products.name"
            },
            productIds: {
              $push: "$products._id"
            }
          }
        }
      ])
      if (result && result[0] && result[0].productIds) {
        productsIds = [...productsIds, ...result[0].productIds];
      }
    }

    console.log(productsIds)
    await productModel.updateMany(
      { _id: { $in: productsIds } },
      [{ $set: { finalPrice: "$price" } }]
    )
    const result = await offerModel.findOneAndDelete({ _id: offerId })
    console.log(result)
    res.status(OK).json({ message: `offer ${offer.name} deleted ` })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminOffersTablePageController,
  getCreateOfferPageController,
  createOfferController,
  deleteOfferController
}