const mongoose = require('mongoose')
const Schema = mongoose.Schema


const walletSchema = new Schema({
  userId: { type: String, required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "INR" },
  transactions: [{
    amount: { type: Number, required: true },
    debit: { type: Boolean, required: true },
    credit: { type: Boolean, required: true },
    date: { type: Date, default: Date.now },
  }]
})

const walletModel = mongoose.model('wallet', walletSchema)
module.exports = walletModel