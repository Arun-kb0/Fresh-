const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objectId = mongoose.Schema.Types.ObjectId

const reviewSchema = new Schema({
  productId: { type: objectId, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  review: { type: String, required: true },
}, { timestamps: true })

const reviewModel = mongoose.model('reviews', reviewSchema)
module.exports = reviewModel