const CustomError = require("../../constants/CustomError")
const { OK, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const { getWalletWithSortedTransactionsAggregation } = require("../../helpers/aggregationPipelines")
const walletModel = require("../../model/walletModel")


const getWalletController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    // let wallet = await walletModel.findOne({ userId: user.userId })
    let wallet = await getWalletWithSortedTransactionsAggregation({userId:user.userId})
    if (!wallet) {
      wallet = await walletModel.create({
        userId: user.userId,
        transactions: []
      })
    }
    res.render('user/profile/wallet', {
      ...viewUsersPage,
      wallet
    })
  } catch (error) {
    next(error)
  }
}

const addAmountToWalletController = async (req, res, next) => {
  const { creditAmount } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    if (!creditAmount || creditAmount < 10 ) {
      throw new CustomError('amount must be grater than 10',BAD_REQUEST)
    }
    const wallet = await walletModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: {
          transactions: {
            amount: Number(creditAmount),
            debit: false,
            credit: true,
            date: new Date()
          }
        },
        $inc: {
          balance: Number(creditAmount)
        }
      },
      { new: true }
    )
    res.status(OK).json({message:'amount added to wallet', wallet})
  } catch (error) {
    next(error)
  }
}




module.exports = {
  getWalletController,
  addAmountToWalletController
}