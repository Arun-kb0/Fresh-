const CustomError = require("../../constants/CustomError")
const { OK, BAD_REQUEST } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const { getWalletWithSortedTransactionsAggregation } = require("../../helpers/aggregationPipelines")
const walletModel = require("../../model/walletModel")


const getWalletController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const user = JSON.parse(req.cookies.user)
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const currentWallet = await walletModel.find({ userId: user.userId })
    const total = currentWallet ? currentWallet[0]?.transactions.length : 0
    const numberOfPages = Math.ceil(total / LIMIT)

    let wallet = await getWalletWithSortedTransactionsAggregation({
      userId: user.userId,
      skip: startIndex,
      limit: LIMIT
    })
    if (!wallet) {
      wallet = await walletModel.create({
        userId: user.userId,
        transactions: []
      })
    }
    res.render('user/profile/wallet', {
      ...viewUsersPage,
      wallet,
      page,
      numberOfPages,
      paypalClientId: process.env.PAYPAL_CLIENT_ID
    })
  } catch (error) {
    next(error)
  }
}

const addAmountToWalletController = async (req, res, next) => {
  let { amount } = req.body
  try {
    console.log(amount)
    amount = parseFloat(amount)
    const user = JSON.parse(req.cookies.user)
    if (!amount || amount < 10) {
      throw new CustomError('amount must be grater than 10', BAD_REQUEST)
    }
    const wallet = await walletModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: {
          transactions: {
            amount: Number(amount),
            debit: false,
            credit: true,
          }
        },
        $inc: {
          balance: Number(amount)
        }
      },
      { new: true }
    )
    res.status(OK).json({ message: 'amount added to wallet', wallet })
  } catch (error) {
    next(error)
  }
}




module.exports = {
  getWalletController,
  addAmountToWalletController
}