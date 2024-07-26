const mongoose = require('mongoose')
const Schema = mongoose.Schema


const userSchema = new Schema({
  userId: { type: String, required: true },
  provider:{type:String , default:null},
  image: { type: String },
  name: { type: String, required: true },
  username: { type: String, required: false },
  password: { type: String, required: false },
  phone: { type: String },
  isActive: { type: Boolean, default: false },
  isPlus: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  referralCode:{type:String,default:null},
}, {
  timestamps: true
})

userSchema.index({ username: 1 })

module.exports = mongoose.model("users", userSchema)
