const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objectId = mongoose.Schema.Types.ObjectId


const ordersSchema = new Schema({
  userId: { type: String, required: true },
  addressId: { type: objectId, required:true},
  OrderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    required: true
  },
  products: [{
    productId: { type: objectId, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  coupon: { type: String },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    required: true
  }
})

const orderModel = mongoose.model('orders', ordersSchema)
module.exports = orderModel