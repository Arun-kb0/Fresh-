const mongoose = require('mongoose')
const Schema = mongoose.Schema


const categorySchema = new Schema({
  image: {
    fileName: String,
    path: String
  },
  name: { type: String, required: true },
  slug: { type: String },
  isDeleted: { type:Boolean , default:false}
},
  { timestamps: true }
)


const categoryModel = mongoose.model("categories", categorySchema)
module.exports = categoryModel


