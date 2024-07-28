const CustomError = require("../constants/CustomError")
const { INTERNAL_SERVER_ERROR } = require("../constants/httpStatusCodes")
const { paymentStatusValues, orderStatusValues } = require("../constants/statusValues")
const couponModel = require("../model/couponModel")
const orderModel = require("../model/orderModel")
const productModel = require("../model/productModel")
const walletModel = require("../model/walletModel")

// * coupon also added to the total if ay
const getOrderTotal = async ({ deliveryFee = 10, order }) => {

  try {
    // * total calculation
    const deliveryFee = 10
    let orderActualTotal = 0
    orderActualTotal += deliveryFee
    order.products.map((product) => {
      if (product.orderStatus !== 'Cancelled'
        && product.orderStatus !== 'Return Requested'
        && product.orderStatus !== 'Return Approved'
        && product.orderStatus !== 'Returned'
      ) {
        orderActualTotal += product.price
      }
    })

    // console.log('orderActualTotal = ', orderActualTotal)
    let orderTotal = 0
    if (order.coupon) {
      const coupon = await couponModel.findOne({ code: order.coupon })
      if (coupon.discountType === 'percentage') {
        const discountAmount = (orderActualTotal * coupon.discountValue) / 100;
        orderTotal = orderActualTotal > (coupon.minCartAmount)
          ? orderActualTotal - discountAmount
          : orderActualTotal

      } else {
        orderTotal = orderActualTotal >= (coupon.discountValue * 2)
          ? orderActualTotal - coupon.discountValue
          : orderActualTotal
      }
    } else {
      orderTotal = orderActualTotal
    }
    console.log("orderTotal =  ", orderTotal)

  } catch (error) {
    console.error(error)
    throw new CustomError(error.message, INTERNAL_SERVER_ERROR)
  }

}


const cancelOrReturnWholeOrder = async ({ userId, orderId, order, orderStatus, paymentStatus,noCheck=false }) => {
  try {
    // ! Returned cod Completed
    const paymentMethod = order.paymentMethod
    console.log('cancelOrReturnWholeOrder')
    console.log(orderStatus, paymentMethod, paymentStatus)
    if (
      (paymentMethod !== 'cod' && orderStatus === orderStatusValues.Cancelled)
      || (paymentStatus === paymentStatusValues.Refunded && orderStatus === orderStatusValues.Returned)
      || (paymentStatus === paymentStatusValues.Completed && orderStatus === orderStatusValues.Returned)
    ) {
      for (const item of order.products) {
        const product = await productModel.findById(item.productId);
        if (!product) {
          throw new CustomError(`Product not found for ID: ${item.productId}`, NOT_FOUND);
        }
        product.stock += item.quantity;
        await product.save();
      }

      const updatedWallet = await walletModel.findOneAndUpdate(
        { userId: userId },
        {
          $inc: { balance: order.total },
          $push: {
            transactions: {
              amount: noCheck ? order.total - 10 : order.total,
              credit: true,
              debit: false
            }
          }
        }
      )

      const updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            orderStatus,
            paymentStatus,
            total: 0
          }
        },
        { new: true }
      )
      return updatedOrder
    } else {
      const updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            orderStatus,
            paymentStatus,
          },
        }
      )
      return updatedOrder
    }


  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = {
  getOrderTotal,
  cancelOrReturnWholeOrder
}