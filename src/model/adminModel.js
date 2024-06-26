const mongoose = require('mongoose')
const Schema = mongoose.Schema


const adminSchema = new Schema({
  image: { type: String },
  name: { type: String },
  username: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true })


module.exports = mongoose.model("admins", adminSchema)
