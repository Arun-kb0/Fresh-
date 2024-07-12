const CustomError = require("../constants/CustomError")
const { BAD_REQUEST, OK } = require("../constants/httpStatusCodes")
const { viewAdminPage } = require("../constants/pageConfid")
const { uploadImageToFirebase } = require("../helpers/uploadImage")
const categoryModel = require("../model/categoryModel")
const offerModel = require("../model/offerModel")
const productModel = require("../model/productModel")
const subCategoryModel = require("../model/subCategoryModel")

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
  try {
    if (!file) {
      throw new CustomError('image required to create offer', BAD_REQUEST)
    }

    console.log(offer)
    const subcategory = offer.subcategory
    const category = offer.category
    const product = offer.product

    const image = await uploadImageToFirebase(file, 'offers')

    const newOffer = await offerModel.create({
      ...offer,
      image,
      categoryIds: category ? [category] : [],
      subcategoryIds: subcategory ? [subcategory] : [],
      productIds: product ? [product] : [],
    })

    res.status(OK).json({ message: 'offer created', newOffer })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getAdminOffersTablePageController,
  getCreateOfferPageController,
  createOfferController
}