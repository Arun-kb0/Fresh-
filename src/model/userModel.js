const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ObjectId = mongoose.Schema.Types.ObjectId

const userSchema = new Schema({
  image: { type: String },
  name: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: false },
  isPlus: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isVerified: {type: Boolean , default:false},
  wallet: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    transactions: [{
      amount: { type: Number, required: true },
      message: { type: String },
      type: {
        type: String,
        required: true,
        enum: ["credit", "debit"]
      },
      date: { type: Date, default: Date.now },
    }]
  }
}, {
  timestamps: true
})


module.exports = mongoose.model("users", userSchema)
