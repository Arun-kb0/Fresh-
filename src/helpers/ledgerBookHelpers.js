const ledgerBookModel = require("../model/ledgerBookModel")

const transactionType = ['Credit', 'Debit']

const createLedgerBookTransaction = async ({ amount, message, type }) => {
  try {
    if (!transactionType.includes(type)) {
      throw new Error('invalid transaction type')
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      throw new Error('Invalid amount');
    }

    isLedgerBook = await ledgerBookModel.findOne()
    if (!isLedgerBook) {
      await ledgerBookModel.create({
        balance: 100000000,
        transactions: [],
      })
    }


    const update = {
      $push: {
        transactions: {
          balanceAfterTransaction: type === 'Credit'
            ? isLedgerBook.balance + parsedAmount
            : isLedgerBook.balance - parsedAmount,
          amount: parsedAmount,
          message,
          type,
          date:new Date()
        }
      },
      $inc: {
        balance: type === 'Credit' ? parsedAmount : -parsedAmount
      }
    };


    const transaction = await ledgerBookModel.findOneAndUpdate(
      {},
      update,
      { new: true }
    )

    console.log("ledger book transaction")
    // console.log(transaction)
  } catch (error) {
    throw error
  }
}


module.exports = {
  createLedgerBookTransaction
}