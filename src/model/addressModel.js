const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objectId = mongoose.Schema.Types.ObjectId

const addressSchema = new Schema({
  userId: { type: String, required: true },
  name:{type:String},
  flatNo: { type: String },
  phone: { type: String },
  email: { type: String },
  state:{type:String},
  country:{type:String},
  city:{type:String},
  place:{type:String},
  pinCode: { type: String },
  isDeleted:{type:Boolean, default:false}
  
})

module.exports = mongoose.model('address',addressSchema)