const orderStatusValues = {
  Pending: 'Pending',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  ReturnRequested: 'Return Requested',
  ReturnApproved: 'Return Approved',
  Returned: 'Returned',
}

const paymentStatusValues = {
  Pending: 'Pending',
  Completed: 'Completed',
  Failed: 'Failed',
  Refunded: 'Refunded'
}

// * validator functions
const { Pending ,Shipped, Delivered, ReturnRequested, Cancelled, ReturnApproved, Returned } = orderStatusValues
const validateOrderStatusTransactions = {
  [Pending]: [Shipped, Cancelled],
  [Shipped]: [Delivered, Cancelled],
  [Delivered]: [ReturnRequested],
  [Cancelled]: [],
  [ReturnRequested]: [ReturnApproved,Cancelled],
  [ReturnApproved]: [Returned],
  [Returned]: []
}

const validatePaymentTransactions = {
  [paymentStatusValues.Pending]: [paymentStatusValues.Completed, paymentStatusValues.Failed],
  [paymentStatusValues.Completed]: [paymentStatusValues.Refunded],
  [paymentStatusValues.Failed]: [],
  [paymentStatusValues.Refunded]: []
}



module.exports = {
  orderStatusValues,
  paymentStatusValues,
  validateOrderStatusTransactions,
  validatePaymentTransactions
}