const { sessionCookieMaxAge } = require("../../config/sessionConfig")
const CustomError = require("../../constants/CustomError")
const { OK, NOT_FOUND, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage, viewPageNotFound } = require("../../constants/pageConfid")
const productModel = require("../../model/productModel")
const userModel = require("../../model/userModel")
const bcrypt = require('bcrypt')
const orderModel = require('../../model/orderModel')
const mongoose = require("mongoose")
const usedCouponsModel = require("../../model/usedCouponsModel")
const { getProductsAggregation, getOrderDetailsAggregation } = require("../../helpers/aggregationPipelines")
const walletModel = require("../../model/walletModel")
const htmlToPdf = require('html-pdf-node')
const ejs = require('ejs')
const path = require('path')


const getCouponsPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const isUsedCoupons = await usedCouponsModel.findOne({ userId: user.userId })
    if (!isUsedCoupons) {
      await usedCouponsModel.create({
        userId: user.userId,
        coupons:[]
      })
    }
    const result = await usedCouponsModel.aggregate([
      {
        $match: {
          userId: user.userId
        }
      },
      {
        $lookup: {
          from: "coupons",
          let: {
            usedCouponIds: "$coupons"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $not: {
                    $in: ["$_id", "$$usedCouponIds"]
                  }
                },
                isDeleted: false
              }
            },
            {
              $sort: {
                startDate: -1
              }
            }
          ],
          as: "unusedCoupons"
        }
      }
    ]
)

    res.render('user/profile/coupons', {
      ...viewUsersPage,
      coupons: (result && result.length !== 0)  
        ? result[0].unusedCoupons
        : []
    })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getCouponsPageController
}