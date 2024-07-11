const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objectId = mongoose.Schema.Types.ObjectId

const cartSchema = new Schema({
  products: [{
    productId: { type: objectId, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }], 
  userId: { type: String, required: true },
  coupon: { type: String },
  couponId: { type: objectId },
  total:{type : Number},
}, { timestamps: true })

cartSchema.index({ userId: 1 })
const cartModel = mongoose.model('cart', cartSchema)
module.exports = cartModel