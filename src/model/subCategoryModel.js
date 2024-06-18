const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ObjectId = mongoose.Schema.Types.ObjectId

const subCategorySchema = new Schema({
  image: {
    fileName: String,
    path: String
  },
  name: { type: String, required: true },
  slug: { type: String },
  parentId: { type: ObjectId, required: true },
  isDeleted: { type: Boolean, default: false }
},
  { timestamps: true }
)


const subCategoryModel = mongoose.model("subCategories", subCategorySchema)
module.exports = subCategoryModel


