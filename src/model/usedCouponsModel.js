const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objectId = mongoose.Schema.Types.ObjectId

const usedCouponsSchema = new Schema({
  userId: { type: String, require: true },
  coupons: { type: [objectId] }
})

const usedCouponsModel = mongoose.model('usedCoupons', usedCouponsSchema)
module.exports = usedCouponsModel