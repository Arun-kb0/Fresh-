const { OK, BAD_REQUEST, NOT_FOUND, CREATED, CONFLICT, GONE } = require("../../constants/httpStatusCodes")
const { viewUsersPage, viewPageNotFound } = require("../../constants/pageConfid")
const cartModel = require("../../model/cartModel")
const productModel = require("../../model/productModel")
const CustomError = require('../../constants/CustomError')
const mongoose = require('mongoose')
const couponModel = require("../../model/couponModel")
const usedCouponsModel = require("../../model/usedCouponsModel")
const { getCartWithDetailsAggregation, cartCheckoutAggregation } = require("../../helpers/aggregationPipelines")


// * helperFunctions
const getCartTotal = ({ cart, deliveryFee = 10 }) => {
  const total = cart.products.reduce((acc, item) => (acc + item.price), 0)
  return total + deliveryFee
}

const calculateDiscount = ({ total, coupon }) => {
  let finalTotal = 0
  if (coupon?.discountType === 'percentage') {
    const discount = (total * coupon.discountValue) / 100;
    finalTotal = total - discount;
  } else if (coupon.discountType === 'amount') {
    finalTotal = total - coupon.discountValue
  }
  return finalTotal
}
// * helper functions end


const getCartPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    const cart = await cartModel.findOne({ userId: user.userId })
    if (!cart) {
      res.render('user/cart/cart', {
        ...viewUsersPage,
        cart: null
      })
      return
    }

    let total = 0
    if (cart?.coupon) {
      const coupon = await couponModel.findOne({ _id: cart.couponId })
      let cartTotal = getCartTotal({ cart, deliveryFee })
      total = calculateDiscount({ total: cartTotal, coupon })
    } else {
      total = getCartTotal({ cart, deliveryFee })
    }
    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      { $set: { total } }
    )
    console.log("total ", total)
    const cartWithDetails = await getCartWithDetailsAggregation({ userId: user.userId, deliveryFee })

    res.render('user/cart/cart', {
      ...viewUsersPage,
      cart: cartWithDetails
    })
  } catch (error) {
    next(error)
  }
}


const addToCartController = async (req, res, next) => {
  const { productId, quantity = 1 } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const userId = user.userId
    if (!mongoose.isObjectIdOrHexString(productId)) {
      throw new CustomError('invalid productId', BAD_REQUEST)
    }
    const product = await productModel.findById(productId)
    if (!product) {
      return res.status(BAD_REQUEST).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(NOT_FOUND).json({ message: "Not enough stock" });
    }

    const isCartExists = await cartModel.findOne({userId})
    


    let updatedCart
    if (isCartExists) {
      const cart = await cartModel.findOne({ userId: userId, 'products.productId': productId });
      const pricePerQuantity = product.finalPrice * quantity
      if (cart) {
        updatedCart = await cartModel.findOneAndUpdate(
          { userId: userId, 'products.productId': productId },
          {
            $inc: {
              'products.$.quantity': quantity,
              'products.$.price': pricePerQuantity,
            },
          },
          { new: true }
        ).populate('products.productId', 'image productInfo.soldBy stock');
  
      } else {
          //*  If the product does not exist, add it to the cart
          updatedCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            {
              $set: {
                userId: userId,
              },
              $addToSet: {
                products: {
                  productId: product._id,
                  quantity: quantity,
                  price: product.finalPrice
                },
              }
            },
            { new: true }
          ).populate('products.productId', 'image productInfo.soldBy stock');
        }
    } else {
      //*  If cart does not exist, add it to the cart
      updatedCart = await cartModel.create({
        userId: userId,
        products: [{
          productId: product._id,
          quantity: quantity,
          price: product.finalPrice * quantity,
        }]
      })
    }
    res.status(OK).json({ message: "item added", product })
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

const deleteItemFromCartController = async (req, res, next) => {
  const { productId } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(productId)) {
      throw new CustomError('invalid productId', BAD_REQUEST)
    }
    const user = JSON.parse(req.cookies.user)
    updatedCart = await cartModel.findOneAndUpdate(
      { userId: user.userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    ).populate('products.productId', 'image productInfo.soldBy stock');

    res.status(OK).json({ message: "item deleted from cart", cart: updatedCart })
  } catch (error) {
    next(error)
  }
}


const getCheckoutPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    const cart = await cartModel.findOne({ userId: user.userId })
    let total = 0
    if (cart?.coupon) {
      const coupon = await couponModel.findOne({ _id: cart.couponId, isDeleted: false })
      let cartTotal = getCartTotal({ cart, deliveryFee })
      total = calculateDiscount({ total: cartTotal, coupon })
    } else {
      total = getCartTotal({ cart, deliveryFee })
    }
    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      { $set: { total } }
    )

    const cartWithDetails = await cartCheckoutAggregation({ userId: user.userId })


    console.log(cartWithDetails.appliedCouponDetails);
    // res.status(OK).json({ message: "get checkout success", checkOutCart: cartWithDetails[0] })
    res.render('user/cart/checkout', {
      ...viewUsersPage,
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
      checkoutCart: cartWithDetails,
      appliedCouponDetails: cartWithDetails.appliedCouponDetails ? cartWithDetails.appliedCouponDetails : null
    })
  } catch (error) {
    next(error)
  }
}


const applyCouponController = async (req, res, next) => {
  const { code } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const coupon = await couponModel.findOne({ code, isDeleted: false })
    if (!coupon) {
      throw new CustomError('invalid coupon code', BAD_REQUEST)
    }
    const currentDate = new Date()
    if (coupon.endDate < currentDate) {
      throw new CustomError('coupon expired', GONE)
    }

    const cart = await cartModel.findOne({ userId: user.userId })
    let total = getCartTotal({ cart })
    let finalTotal = calculateDiscount({ total, coupon })

    if (cart.coupon) {
      throw new CustomError('coupon already added remove to add another', CONFLICT)
    }
    if (total < coupon.minCartAmount) {
      throw new CustomError(`₹${coupon.minCartAmount} is required to apply this coupon`, BAD_REQUEST)
    }
    if (total > coupon?.maxCartAmount) {
      throw new CustomError(`₹${coupon.maxCartAmount} is max limit of this coupon`, BAD_REQUEST)
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new CustomError('coupon limit exceeded', GONE)
    }


    const usedCoupons = await usedCouponsModel.findOne({
      userId: user.userId,
      coupons: { $elemMatch: { $eq: coupon._id } }
    })
    console.log("coupon code ")
    console.log(coupon._id)
    console.log(usedCoupons)

    if (usedCoupons) {
      throw new CustomError('coupon already used', CONFLICT)
    }


    await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          coupon: coupon.code,
          couponId: coupon._id,
          total: finalTotal,
        }
      },
      { new: true }
    )

    const updatedUsedCoupons = await usedCouponsModel.findOneAndUpdate(
      { userId: user.userId },
      { $push: { coupons: coupon._id } },
      { new: true }
    )

    res.status(OK).json({ message: 'coupon applied', coupon, finalTotal })
  } catch (error) {
    next(error)
  }
}

const removeCouponController = async (req, res, next) => {
  const { couponId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    if (!mongoose.isObjectIdOrHexString(couponId)) {
      throw new CustomError('invalid couponId', BAD_REQUEST)
    }
    const cart = await cartModel.findOne({ userId: user.userId })
    const usedCoupons = await usedCouponsModel.findOneAndUpdate(
      { userId: user.userId },
      { $pull: { coupons: couponId } },
      { new: true }
    )

    let total = getCartTotal({ cart })
    const updatedCart = await cartModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          coupon: null,
          couponId: null,
          total: total.toFixed(2)
        }
      },
      { new: true }
    )

    res.status(OK).json({
      message: 'coupon removed ',
      cart: updatedCart
    })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getCartPageController,
  addToCartController,
  updateQuantityController,
  deleteItemFromCartController,
  getCheckoutPageController,

  applyCouponController,
  removeCouponController,

  
}