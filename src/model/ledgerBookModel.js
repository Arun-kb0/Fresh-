const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ledgerBookSchema = new Schema({
  balance: { type: Number },
  transactions: [{
    balanceAfterTransaction:{type: Number , require:true},
    date: { type: Date, default: new Date },
    amount: { type: Number, required: true },
    message: { type: String },
    type: {
      type: String, 
      enum: ['Credit', 'Debit'],
    }
  }]
},{timestamps:true})

const ledgerBookModel = mongoose.model('ledgerbook', ledgerBookSchema)
module.exports = ledgerBookModel