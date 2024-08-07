const { viewAdminPage } = require("../../constants/pageConfid")
const ledgerBookModel = require("../../model/ledgerBookModel")


const getLedgerBookController = async (req, res, next) => {
  const {page=1} = req.query
  try {
    const fullLedgerBook = await ledgerBookModel.findOne()
    if (!fullLedgerBook) {
      await ledgerBookModel.create({
        balance: 100000000,
        transactions: [],
      })
    }
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const total = fullLedgerBook?.transactions ? fullLedgerBook?.transactions.length : 0
    const numberOfPages = Math.ceil(total / LIMIT)

    const ledgerBook = await ledgerBookModel.aggregate([
      { $unwind: "$transactions" },
      { $sort: { "transactions.date": -1 } },
      { $skip: startIndex },
      { $limit: LIMIT },
      {
        $group: {
          _id: "$_id",
          balance: { $first: "$balance" },
          transactions: { $push: "$transactions" }
        }
      }
    ]);
    
    console.log(ledgerBook)

    res.render('admin/reports/ledgerBook', {
      ...viewAdminPage,
      ledgerBook: ledgerBook ? ledgerBook[0] : null ,
      page,
      numberOfPages
    })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getLedgerBookController
}