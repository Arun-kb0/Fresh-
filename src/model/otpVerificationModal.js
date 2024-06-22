const mongoose = require("mongoose")
const Schema = mongoose.Schema


const UserOtpVerificationSchema = new Schema({
  username: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, expires: 30 },
})

module.exports = mongoose.model(
  "userOtpVerification",
  UserOtpVerificationSchema
)