const CustomError = require("../../constants/CustomError")
const { viewUsersPage } = require("../../constants/pageConfid")
const usedCouponsModel = require("../../model/usedCouponsModel")




const getCouponsPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const isUsedCoupons = await usedCouponsModel.findOne({ userId: user.userId })
    if (!isUsedCoupons) {
      await usedCouponsModel.create({
        userId: user.userId,
        coupons: []
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