const { OK, BAD_REQUEST, NOT_FOUND } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const cartModel = require("../../model/cartModel")
const productModel = require("../../model/productModel")
const CustomError = require('../../constants/CustomError')

const getCartPageController = async (req, res, next) => {
  try {
    // const cartItems = await productModel.findOne({ _id: "667e9da58819d87666e99ae5" })
    const user = JSON.parse(req.cookies.user)

    const cartWithDetails = await cartModel.aggregate([
      { $match: { userId: user.userId } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 1,
          "products.productId": 1,
          "products.quantity": 1,
          "products.price": 1,
          productName: "$productDetails.name",
          image: "$productDetails.image.path", // Extract single image path
          soldBy: "$productDetails.productInfo.soldBy", // Extract soldBy
          stock: "$productDetails.stock"
        }
      },
      {
        $group: {
          _id: "$_id",
          products: {
            $push: {
              productId: "$products.productId",
              name: "$productName",
              quantity: "$products.quantity",
              price: "$products.price",
              image: "$image",
              soldBy: "$soldBy",
              stock: "$stock"
            }
          }
        }
      }
    ]);


    // res.status(OK).json({ cart: cartWithDetails[0] })
    res.render('user/cart/cart', { ...viewUsersPage, cart: cartWithDetails[0] })
  } catch (error) {
    next(error)
  }
}


const addToCartController = async (req, res, next) => {
  const { productId, quantity = 1 } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const userId = user.userId
    const product = await productModel.findById(productId).select('stock finalPrice image productInfo.soldBy');
    if (!product) {
      return res.status(BAD_REQUEST).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(NOT_FOUND).json({ message: "Not enough stock" });
    }

    const cart = await cartModel.findOne({ userId: userId, 'products.productId': productId });

    const pricePerQuantity = product.finalPrice * quantity
    let updatedCart
    if (cart) {
      // If the product exists, increment the quantity
      updatedCart = await cartModel.findOneAndUpdate(
        { userId: userId, 'products.productId': productId },
        {
          $inc: {
            'products.$.quantity': quantity,
            'products.$.price': pricePerQuantity
          }
        },
        { new: true }
      ).populate('products.productId', 'image productInfo.soldBy stock');

    } else {
      // If the product does not exist, add it to the cart
      updatedCart = await cartModel.findOneAndUpdate(
        { userId: userId },
        {
          $set: { userId: userId },
          $addToSet: {
            products: {
              productId: product._id,
              quantity: quantity,
              price: product.finalPrice
            }
          }
        },
        { new: true, upsert: true }
      ).populate('products.productId', 'image productInfo.soldBy stock');
    }




    res.status(OK).json({ message: "item added", cart: updatedCart })
  } catch (error) {
    next(error)
  }
}

const updateQuantityController = async (req, res, next) => {
  const { productId, quantity } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const userId = user.userId
    const product = await productModel.findById(productId).select('stock finalPrice image productInfo.soldBy');
    if (!product) {
      throw new CustomError('Product not found', BAD_REQUEST)
    }

    if (product.stock < quantity) {
      throw new CustomError('Not enough stock', NOT_FOUND)
    }

    const cart = await cartModel.findOne({ userId: userId, 'products.productId': productId });
    if (!cart) {
      throw new CustomError('cart does not exists', NOT_FOUND)
    }

    const pricePerQuantity = product.finalPrice * quantity
    let updatedCart
    updatedCart = await cartModel.findOneAndUpdate(
      { userId: userId, 'products.productId': productId },
      {
        $set: {
          'products.$.quantity': quantity,
          'products.$.price': pricePerQuantity
        }
      },
      { new: true }
    ).populate('products.productId', 'image productInfo.soldBy stock');

    res.status(OK).json({ message: "quantity updated", cart: updatedCart })
  } catch (error) {
    next(error)
  }
}



module.exports = {
  getCartPageController,
  addToCartController,
  updateQuantityController
}