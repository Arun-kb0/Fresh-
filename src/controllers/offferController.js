const CustomError = require("../constants/CustomError")
const { BAD_REQUEST, OK, NOT_FOUND, NO_CONTENT, CONFLICT } = require("../constants/httpStatusCodes")
const { viewAdminPage, viewPageNotFound } = require("../constants/pageConfid")
const { uploadImageToFirebase } = require("../helpers/uploadImage")
const categoryModel = require("../model/categoryModel")
const offerModel = require("../model/offerModel")
const productModel = require("../model/productModel")
const subCategoryModel = require("../model/subCategoryModel")
const mongoose = require('mongoose')


applyMaxDiscountsToProducts = async ({ productIds, offerId }) => {
  const products = await productModel.find({ _id: { $in: productIds } });
  const offers = await offerModel.find({
    productIds: { $in: productIds },
    _id: { $ne: offerId }
  });

  const maxDiscounts = {};

  //* Calculate the maximum discount for each product
  offers.forEach(offer => {
    offer.productIds.forEach(productId => {
      if (!maxDiscounts[productId]) {
        maxDiscounts[productId] = { discountType: offer.discountType, discountValue: 0 };
      }

      let discount = 0;
      if (offer.discountType === 'percentage') {
        discount = offer.discountValue;
      } else if (offer.discountType === 'amount') {
        discount = offer.discountValue;
      }

      // Check if this offer provides a better discount
      if (offer.discountType === 'percentage' && discount > maxDiscounts[productId].discountValue) {
        maxDiscounts[productId] = { discountType: 'percentage', discountValue: discount };
      } else if (offer.discountType === 'amount' && (maxDiscounts[productId].discountType !== 'percentage' || discount > maxDiscounts[productId].discountValue)) {
        maxDiscounts[productId] = { discountType: 'amount', discountValue: discount };
      }
    });
  });

  // *  Create bulk update operations
  const bulkOperations = products.map(product => {
    const { discountType, discountValue } = maxDiscounts[product._id] || { discountType: null, discountValue: 0 };
    let finalPrice = product.price;

    if (discountType === 'percentage') {
      finalPrice = product.price - (product.price * (discountValue / 100));
    } else if (discountType === 'amount') {
      finalPrice = product.price - discountValue;
    }

    if (discountType) {
      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              finalPrice: finalPrice,
              "offer.discountType": discountType,
              "offer.discountValue": discountValue,
            }
          }
        }
      };
    } else {
      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              finalPrice: finalPrice,
              offer: {}
            }
          }
        }
      };
    }
  });

  // console.log('maxDiscounts')
  // console.log(maxDiscounts)
  // console.log('bulkOperations')
  // console.log(bulkOperations)

  // Execute the bulk write operation
  const result = await productModel.bulkWrite(bulkOperations);
  return result
}





const getAdminOffersTablePageController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await offerModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)


    const result = await offerModel.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryIds",
          foreignField: "_id",
          as: "categories"
        }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategoryIds",
          foreignField: "_id",
          as: "subcategories"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "field",
          foreignField: "productIds",
          as: "products"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          discountType: 1,
          discountValue: 1,
          startDate: 1,
          endDate: 1,
          isDisabled: 1,
          createdAt: 1,
          updatedAt: 1,
          products: {
            $map: {
              input: "$products",
              as: "product",
              in: "$$product.name"
            }
          },
          categories: {
            $map: {
              input: "$categories",
              as: "category",
              in: "$$category.name"
            }
          },
          subcategories: {
            $map: {
              input: "$subcategories",
              as: "subcategory",
              in: "$$subcategory.name"
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: LIMIT },
      { $skip: startIndex }
    ])

    res.render('admin/offer/offersTable', {
      ...viewAdminPage,
      offers: result ? result : [],
      numberOfPages,
      page: Number(page)
    })
  } catch (error) {
    next(error)
  }
}

const getCreateOfferPageController = async (req, res, next) => {
  const { isProductOffer, isSubcategoryOffer, isCategoryOffer } = req.query

  try {
    if (!isProductOffer && !isSubcategoryOffer && !isCategoryOffer) {
      console.log('invalid query params')
      res.render('user/notfound/notFound', { ...viewPageNotFound, backToAdmin: true })
      return
    }

    const categories = await categoryModel.find({ isDeleted: false }).select('_id name')
    const subcategories = await subCategoryModel.find({ isDeleted: false }).select('_id name')
    const products = await productModel.find({ isDeleted: false }).select('_id name')

    let offerPageControl = {
      isProductOffer: true,
      isSubcategoryOffer: false,
      isCategoryOffer: false,
    }
    if (isProductOffer) {
      offerPageControl = {
        isProductOffer: true,
        isSubcategoryOffer: false,
        isCategoryOffer: false,
      }
    } else if (isSubcategoryOffer) {
      offerPageControl = {
        isProductOffer: false,
        isSubcategoryOffer: true,
        isCategoryOffer: false,
      }
    } else if (isCategoryOffer) {
      offerPageControl = {
        isProductOffer: false,
        isSubcategoryOffer: false,
        isCategoryOffer: true,
      }
    } else {
      throw new CustomError('invalid route', NOT_FOUND)
    }

    res.render('admin/offer/createOffer', {
      ...viewAdminPage,
      ...offerPageControl,
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

    if (!offer.discountType && !offer.discountValue) {
      throw new CustomError('discount type and value required', BAD_REQUEST)
    }

    if (offer.discountType === 'percentage' && (offer.discountValue >= 99 || offer.discountValue <= 0)) {
      throw new CustomError('cannot apply discount more than 99%', BAD_REQUEST)
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
      productsIds = result[0]?.productIds || []
    }
    if (subcategoryId) {
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
      productsIds = [...productsIds, ...(result[0]?.productIds || [])];
    }
    if (productId) {
      productsIds = [...productsIds, productId]
    }

    console.log(productsIds)
    if (!productsIds || productsIds.length === 0) {
      throw new CustomError('no products found to apply offer', NOT_FOUND)
    }


    const image = await uploadImageToFirebase(file, 'offers')
    const newOffer = await offerModel.create({
      ...offer,
      image,
      categoryIds: categoryId ? [categoryId] : [],
      subcategoryIds: subcategoryId ? [subcategoryId] : [],
      productIds: productsIds ? productsIds : [],
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

      console.log(product.finalPrice, " - ", finalPrice)

      if (finalPrice <= product.finalPrice) {
        return {
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                finalPrice: finalPrice,
                "offer.discountType": discountType,
                "offer.discountValue": discountValue,
              }
            }
          }
        }
      } else {
        return {
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                finalPrice: product.finalPrice,
                "offer.discountType": product.discountType,
                "offer.discountValue": product.discountValue,
              }
            }
          }
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
          $match: { _id: { $in: subcategoryIds } }
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

    const bulkWriteResult = await applyMaxDiscountsToProducts({
      productIds: productsIds,
      offerId
    })
    console.log('Bulk update result:', bulkWriteResult);


    // console.log(productsIds)
    // await productModel.updateMany(
    //   { _id: { $in: productsIds } },
    //   [{
    //     $set: {
    //       finalPrice: "$price",
    //       offer: {}
    //     }
    //   }]
    // )
    await offerModel.findOneAndDelete({ _id: offerId })
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