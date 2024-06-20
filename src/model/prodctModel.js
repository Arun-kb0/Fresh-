const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ObjectId = mongoose.Schema.Types.ObjectId

const productSchema = new Schema({
  image: [{
    fileName: { type: String },
    originalName:{type:String},
    path: { type: String },
  }],
  name: { type: String, required: true },
  price: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  stock: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  peopleRated: { type: Number, default: 0 },
  categoryId: { type: ObjectId, required: true },
  reviewsId: { type: ObjectId },
  productInfo: {
    description: { type: String },
    featuresAndDetails: { type: String },
    brand: { type: String },
    soldBy: { type: String },
    location: { type: String }
  },
  isDeleted: { type: Boolean, default: false }
},
  { timestamps: true }
)


const productModel = mongoose.model("products", productSchema)
module.exports = productModel