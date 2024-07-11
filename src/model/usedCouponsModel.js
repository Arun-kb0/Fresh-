const mongoose = require('mongoose')
const Schema = mongoose.Schema

const usedCouponsSchema = new Schema({
  userId:{type:String, require:true},
  coupons: { type: [String] }
})

const usedCouponsModel = mongoose.model('usedCoupons', usedCouponsSchema)
module.exports = usedCouponsModel