const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objectId = mongoose.Schema.Types.ObjectId


const ordersSchema = new Schema({
  userId: { type: String, required: true },
  addressId: { type: objectId, required: true },
  orderStatus: {
    type: String,
    enum: [
      'Pending',
      'Shipped',
      'Delivered',
      'Cancelled',
      'Return Requested',
      'Return Approved',
      'Returned',
    ],
    required: true
  },
  products: [{
    productId: { type: objectId, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  coupon: { type: String ,default:null},
  total: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['cod', 'wallet', 'online'],
    required: true
  },
  coupon: { type: String },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    required: true
  },
  paymentDetails: {
    paymentID: {type:String},
    payerID: {type:String},
    orderID: {type:String},
    paymentSource: {type:String},
  }
}, { timestamps: true })

const orderModel = mongoose.model('orders', ordersSchema)
module.exports = orderModel