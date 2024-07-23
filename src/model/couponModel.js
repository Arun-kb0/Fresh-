const mongoose = require('mongoose')
const Schema = mongoose.Schema

const couponSchema = new Schema({
  code: { type: String, required: true },
  minCartAmount: { type: Number, required: true },
  discountValue: { type: Number, required: true },
  discountType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  usageLimit: { type: Number, required: true },
  usedCount: { type: Number },
  image: {
    fileName: String,
    originalName: String,
    path: String
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true })

couponSchema.index({ code: 1 })

const couponModel = mongoose.model('coupons', couponSchema)
module.exports = couponModel