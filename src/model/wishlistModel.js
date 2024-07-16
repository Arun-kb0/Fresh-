const mongoose = require('mongoose')
const Schema = mongoose.Schema


const objectId = mongoose.Schema.Types.ObjectId

const wishlistSchema = new Schema({
  userId: { type: String, required: true },
  productIds: { type: [objectId], default: [] }
})

wishlistSchema.index({ userId: 1 })

const wishlistModel = mongoose.model('wishlists', wishlistSchema)
module.exports = wishlistModel