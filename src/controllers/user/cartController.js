const { OK, BAD_REQUEST, NOT_FOUND, CREATED, CONFLICT, GONE } = require("../../constants/httpStatusCodes")
const { viewUsersPage } = require("../../constants/pageConfid")
const cartModel = require("../../model/cartModel")
const productModel = require("../../model/productModel")
const CustomError = require('../../constants/CustomError')
const mongoose = require('mongoose')
const addressModel = require("../../model/addressModel")
const orderModel = require("../../model/orderModel")
const couponModel = require("../../model/couponModel")
const usedCouponsModel = require("../../model/usedCouponsModel")
const paypal = require('@paypal/checkout-server-sdk')
const CC = require('currency-converter-lt')
const { validateOrderStatusTransactions, orderStatusValues, paymentStatusValues } = require('../../constants/statusValues')
const walletModel = require("../../model/walletModel")

let currencyConverter = new CC({ from: "INR", to: "USD", amount: 100 })


const Environment =
  process.env.NODE_ENV === 'prod'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment

const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
)


const getCartPageController = async (req, res, next) => {
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

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
          stock: "$productDetails.stock",
          productTotalPrice: "$products.price"
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
          },
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$products.quantity" },
          totalPrice: { $sum: "$productTotalPrice" }
        }
      },
      {
        $addFields: {
          totalItems: "$totalItems",
          totalQuantity: "$totalQuantity",
          subTotalPrice: "$totalPrice",
          deliveryFee: deliveryFee,
          totalPrice: { $add: ["$totalPrice", deliveryFee] }
        }
      }
    ]);

    // res.status(OK).json({ cart: cartWithDetails[0] })
    res.render('user/cart/cart', {
      ...viewUsersPage,
      cart: cartWithDetails.length > 0 ? cartWithDetails[0] : null
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

    const cartWithDetails = await cartModel.aggregate([
      {
        $match: {
          userId: user.userId
        }
      },
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails"
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          coupon: 1,
          "products.quantity": 1,
          "products.productId": 1,
          productName: "$productDetails.name",
          image: {
            $arrayElemAt: [
              "$productDetails.image.path",
              0
            ]
          },
          soldBy:
            "$productDetails.productInfo.soldBy",
          stock: "$productDetails.stock",
          productTotalPrice: "$products.price"
        }
      },
      {
        $group: {
          _id: "$_id",
          userId: {
            $first: "$userId"
          },
          appliedCoupon: {
            $first: "$coupon"
          },
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
          },
          totalItems: {
            $sum: 1
          },
          totalQuantity: {
            $sum: "$products.quantity"
          },
          subTotalPrice: {
            $sum: "$productTotalPrice"
          }
        }
      },
      {
        $addFields: {
          deliveryFee: deliveryFee,
          totalPrice: {
            $add: ["$subTotalPrice", deliveryFee]
          }
        }
      },
      {
        $lookup: {
          from: "addresses",
          localField: "userId",
          foreignField: "userId",
          as: "addresses"
        }
      },
      {
        $lookup: {
          from: "usedcoupons",
          localField: "userId",
          foreignField: "userId",
          as: "usedcoupons"
        }
      },
      {
        $lookup: {
          from: "coupons",
          let: {
            usedCoupons: "$usedcoupons"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $not: {
                    $in: [
                      "$_id",
                      {
                        $reduce: {
                          input: "$$usedCoupons",
                          initialValue: [],
                          in: {
                            $setUnion: [
                              "$$value",
                              "$$this.coupons"
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          ],
          as: "unusedCoupons"
        }
      },
      {
        $lookup: {
          from: "coupons",
          localField: "appliedCoupon",
          foreignField: "code",
          as: "appliedCouponDetails"
        }
      },
      {
        $project: {
          totalItems: 1,
          totalQuantity: 1,
          subTotalPrice: 1,
          deliveryFee: 1,
          totalPrice: 1,
          unusedCoupons: 1,
          appliedCouponDetails: { $arrayElemAt: ["$appliedCouponDetails", 0] },
          addresses: {
            $filter: {
              input: "$addresses",
              as: "address",
              cond: {
                $eq: ["$$address.isDeleted", false]
              }
            }
          }
        }
      }
    ]);

    console.log(cartWithDetails[0].appliedCouponDetails);
    // res.status(OK).json({ message: "get checkout success", checkOutCart: cartWithDetails[0] })
    res.render('user/cart/checkout', {
      ...viewUsersPage,
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
      checkoutCart: cartWithDetails.length > 0 ? cartWithDetails[0] : null,
      appliedCouponDetails: cartWithDetails?.[0].appliedCouponDetails ? cartWithDetails[0].appliedCouponDetails : null
    })
  } catch (error) {
    next(error)
  }
}


const orderUsingCodController = async (req, res, next) => {
  const { addressId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    if (!mongoose.isObjectIdOrHexString(addressId)) {
      throw new CustomError("invalid address id", BAD_REQUEST)
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      throw new CustomError('Address not found', BAD_REQUEST);
    }

    const cart = await cartModel.findOne({ userId: user.userId });
    if (!cart || cart.products.length === 0) {
      throw new CustomError('Cart is empty', BAD_REQUEST);
    }

    const total = cart.products.reduce((sum, item) => sum + item.price, 0) + deliveryFee
    cart.total = total
    console.log(cart)
    // * decreasing stock
    for (const item of cart.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError('Product not found', BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for product: ${product.name}`, BAD_REQUEST);
      }
      product.stock -= item.quantity;
      await product.save();
    }

    const newOrder = await orderModel.create({
      addressId: address._id,
      orderStatus: 'Pending',
      products: cart.products,
      total: cart.total,
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      userId: user.userId,
      coupon: cart.coupon ? cart.coupon : null
    });


    await cartModel.findOneAndUpdate({ userId: user.userId }, { products: [] });
    await usedCouponsModel.findOneAndUpdate(
      { userId: user.userId },
      {
        userId: user.userId,
        $addToSet: {
          coupons: cart.couponId
        }
      },
      {
        upsert: true,
      }
    )
    await couponModel.findOneAndUpdate(
      { _id: cart.couponId },
      { $inc: { usedCount: 1 } }
    )

    res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    next(error)
  }
}


const orderUsingPaypalController = async (req, res, next) => {
  const { addressId } = req.body
  try {
    console.log(" addressId ", addressId)
    const user = JSON.parse(req.cookies.user)
    const deliveryFee = 10

    if (!mongoose.isObjectIdOrHexString(addressId)) {
      throw new CustomError("invalid address id", BAD_REQUEST)
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      throw new CustomError('Address not found', BAD_REQUEST);
    }


    let cart = await cartModel.findOneAndUpdate({ userId: user.userId });
    if (!cart || cart.products.length === 0) {
      throw new CustomError('Cart is empty', BAD_REQUEST);
    }

    const total = cart.products.reduce((sum, item) => sum + item.price, 0) + deliveryFee
    cart = await cartModel.findOneAndUpdate(
      { userId: user.userId },
      { $set: { total: total } },
      { new: true }
    )

    const request = new paypal.orders.OrdersCreateRequest()
    let totalInUsd = await currencyConverter.convert(total)
    totalInUsd = totalInUsd.toFixed(2)

    console.log("totalInUsd ", totalInUsd)

    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: totalInUsd,
            breakdown: {
              currency_code: 'IN',
              value: totalInUsd
            }
          }
        }
      ]
    })

    const order = await paypalClient.execute(request)
    console.log(order)
    res.status(OK).json({ id: order.result.id })
  } catch (error) {
    next(error)
  }
}

const orderSuccessPaypalController = async (req, res, next) => {
  const { paymentID, payerID, orderID, paymentSource, addressId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    const cart = await cartModel.findOne({ userId: user.userId })

    if (!cart) {
      throw new CustomError('cart not found', NOT_FOUND)
    }

    // * decreasing stock
    for (const item of cart.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError('Product not found', BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for product: ${product.name}`, BAD_REQUEST);
      }
      product.stock -= item.quantity;
      await product.save();
    }

    const newOrder = await orderModel.create({
      addressId: addressId,
      orderStatus: 'Pending',
      products: cart.products,
      total: cart.total,
      paymentMethod: 'online',
      paymentStatus: 'Completed',
      userId: user.userId,
      coupon: cart?.coupon ? cart.coupon : null,
      paymentDetails: {
        paymentID,
        payerID,
        orderID,
        paymentSource,
      }
    });

    console.log(cart.total)
    console.log(newOrder.total)

    await cartModel.findOneAndUpdate({ userId: user.userId }, { products: [] });

    if (cart.couponId) {
      await usedCouponsModel.findOneAndUpdate(
        { userId: user.userId },
        {
          userId: user.userId,
          $addToSet: {
            coupons: cart.couponId
          }
        },
        { upsert: true, }
      )
      await couponModel.findOneAndUpdate(
        { _id: cart.couponId },
        { $inc: { usedCount: 1 } }
      )
    }

    res.status(CREATED).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    next(error)
  }
}

const cancelOrderController = async (req, res, next) => {
  const { orderId } = req.body
  try {
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError("invalid orderId", BAD_REQUEST)
    }
    const order = await orderModel.findOne({ _id: orderId })
    if (order.orderStatus === orderStatusValues.Delivered) {
      throw new CustomError("cannot cancel delivered order", BAD_REQUEST)
    }
    if (order.orderStatus === orderStatusValues.Cancelled) {
      throw new CustomError("order already cancelled", CONFLICT)
    }

    let paymentStatus = paymentStatusValues.Failed
    let orderStatus = orderStatusValues.Cancelled
    if (order.orderStatus === orderStatusValues.ReturnRequested) {
      paymentStatus = paymentStatusValues.Completed
      orderStatus = orderStatusValues.Delivered
    }
    console.log("paymentStatus ", paymentStatus)


    if (!validateOrderStatusTransactions[order.orderStatus].includes(orderStatusValues.Cancelled)) {
      throw new CustomError('already cancelled or returned', BAD_REQUEST)
    }


    // * increasing stock
    for (const item of order.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError(`Product not found for ID: ${item.productId}`, NOT_FOUND);
      }
      product.stock += item.quantity;
      await product.save();
    }

    const cancelledOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus,
          paymentStatus
        }
      },
      { new: true }
    )
    // console.log(cancelledOrder)
    res.status(OK).json({ message: "order cancelled", order: cancelledOrder })
  } catch (error) {
    next(error)
  }
}

const returnOrderController = async (req, res, next) => {
  const { orderId } = req.body
  try {
    const user = JSON.parse(req.cookies.user)
    if (!mongoose.isObjectIdOrHexString(orderId)) {
      throw new CustomError("invalid orderId", BAD_REQUEST)
    }
    const order = await orderModel.findOne({ _id: orderId })
    if (order.orderStatus !== orderStatusValues.Delivered) {
      throw new CustomError("cannot return the order thats not delivered", BAD_REQUEST)
    }

    if (!validateOrderStatusTransactions[order.orderStatus].includes(orderStatusValues.ReturnRequested)) {
      throw new CustomError('already cancelled or returned', BAD_REQUEST)
    }

    // * increasing stock
    for (const item of order.products) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new CustomError(`Product not found for ID: ${item.productId}`, NOT_FOUND);
      }
      product.stock += item.quantity;
      await product.save();
    }

    await walletModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: {
          transactions: {
            amount: order.total,
            debit: false,
            credit: true,
            date: new Date()
          }
        },
        $inc: {
          balance: order.total
        }
      },
      { new: true }
    )

    const cancelledOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus: 'Return Requested',
        }
      },
      { new: true }
    )
    res.status(OK).json({ message: "order return request", order: cancelledOrder })
  } catch (error) {
    next(error)
  }
}


const applyCouponController = async (req, res, next) => {
  const { code, total } = req.body
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

    if (total < coupon.minCartAmount) {
      throw new CustomError(`${coupon.minCartAmount} is required to apply this coupon`, BAD_REQUEST)
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new CustomError('coupon limit exceeded', GONE)
    }

    const usedCoupons = await usedCouponsModel.findOne({
      userId: user.userId,
      coupons: { $elemMatch: { $eq: coupon._id } }
    })

    if (usedCoupons) {
      throw new CustomError('coupon already used', CONFLICT)
    }

    let finalTotal = total
    if (coupon.discountType === 'percentage') {
      const discount = (total * coupon.discountValue) / 100;
      finalTotal = total - discount;
    } else if (coupon.discountType === 'amount') {
      finalTotal = total - coupon.discountValue
    }

    const cart = await cartModel.findOneAndUpdate(
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

    res.status(OK).json({ message: 'coupon applied', coupon, finalTotal })
  } catch (error) {
    next(error)
  }
}

const removeCouponController = async (req, res, next) => {
  const { couponId } = req.body
  try {
    if (mongoose.isObjectIdOrHexString(couponId)) {
      throw new CustomError('invalid couponId',BAD_REQUEST)
    }

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

  orderUsingCodController,
  orderUsingPaypalController,
  orderSuccessPaypalController,

  cancelOrderController,
  returnOrderController,

  applyCouponController,
  removeCouponController
}