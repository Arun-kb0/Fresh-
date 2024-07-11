const CustomError = require("../../constants/CustomError")
const { OK, BAD_REQUEST, CONFLICT } = require("../../constants/httpStatusCodes")
const { viewAdminPage } = require("../../constants/pageConfid")
const { uploadImageToFirebase } = require("../../helpers/uploadImage")
const couponModel = require("../../model/couponModel")


const getCouponsPageController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 6
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await couponModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    const coupons = await couponModel.find({ isDeleted: false })
      .sort({ createdAt: -1 }).skip(startIndex).limit(LIMIT)

    res.render('admin/coupon/couponTable', {
      ...viewAdminPage,
      coupons,
      numberOfPages,
      page: Number(page)
    })

  } catch (error) {
    next(error)
  }
}

const getCreateCouponPageController = async (req, res, next) => {
  try {
    res.render('admin/coupon/createCoupon', { ...viewAdminPage })
  } catch (error) {
    next(error)
  }
}

const createCouponController = async (req, res, next) => {
  const couponData = req.body
  const file = req.file
  try {
    if (!file) {
      throw new CustomError('image required to create coupon', BAD_REQUEST)
    }

    const isExists = await couponModel.findOne({ code: couponData.code , isDeleted:false })
    if (isExists) {
      throw new CustomError('coupon already exists ', CONFLICT)
    }
    const image = await uploadImageToFirebase(file, 'coupons')
    const newCoupon = await couponModel.create({
      image,
      ...couponData
    })

    res.status(OK).json({ message: "coupon created ", coupon: newCoupon })
  } catch (error) {
    next(error)
  }
}



const deleteCouponController = async (req, res, next) => {
  const { code } = req.body
  try {
    const result = await couponModel.findOneAndUpdate(
      { code },
      {
        $set: {
          isDeleted: true
        }
      }
    )
    console.log(result)
    res.status(OK).json({ message: `coupon ${code} deleted` })
  } catch (error) {
    next(error)
  }
}






module.exports = {
  getCouponsPageController,
  createCouponController,
  deleteCouponController,
  getCreateCouponPageController
}