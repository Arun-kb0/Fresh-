const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objectId = Schema.Types.ObjectId
const offerSchema = new Schema({
  name: { type: String },
  image: {
    fileName: String,
    originalName: String,
    path: String
  },
  discountType: {
    type: String,
    enum: ['percentage', 'amount'],
    required: true
  },
  discountValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  productIds: { type: [objectId], default: [] },
  categoryIds: { type: [objectId], default: [] },
  subcategoryIds: { type: [objectId], default: [] },
}, { timestamps: true })

const offerModel = mongoose.model('offers', offerSchema)
module.exports = offerModel