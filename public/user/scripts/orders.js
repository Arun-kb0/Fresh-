$(function () {

  const orderStatus = $(".orderStatus")
  const paymentStatus = $('.paymentStatus')
  const createdAt = $(".createdAt")
  const orderCancelBtn = $(".orderCancelBtn")
  const orderReturnBtn = $(".orderReturnBtn")


  orderCancelBtn.on("click", handleCancelOrder)
  orderReturnBtn.on("click", handleReturnOrder)

  function handleCancelOrder() {
    const orderId = $(this).attr("data-orderId")
    const button = $(this)
    const parent = button.parent().parent()
    const orderStatus = parent.find('.orderStatus')
    const paymentStatus = parent.find('.paymentStatus')
    const returnBtn = parent.find(".orderReturnBtn")

    console.log(orderId)
    $.ajax({
      url: '/cart/order/cancel',
      method: "PATCH",
      data: { orderId },
      success: function (data) {
        console.log(data)
        if (data?.order) {
          button.hide()
          returnBtn.hide()
          let orderStatusClassValue = "px-3 rounded-pill text-white orderStatus bg-danger"
          let paymentStatusClassValue = "px-3 rounded-pill text-white paymentStatus bg-danger"
          if (data.order.orderStatus === 'Delivered') {
            orderStatusClassValue = "px-3 rounded-pill text-white orderStatus bg-success"
            paymentStatusClassValue = "px-3 rounded-pill text-white paymentStatus bg-success"
            returnBtn.show()
          }
          orderStatus
            .text(data.order.orderStatus)
            .removeClass()
            .addClass(orderStatusClassValue)
          paymentStatus
            .text(data.order.paymentStatus)
            .removeClass()
            .addClass(paymentStatusClassValue)
          showAlert(data.message)


        } else {
          console.log("invalid data")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }

    })
  }

  function handleReturnOrder() {
    const orderId = $(this).attr("data-orderId")
    const button = $(this)
    const parent = button.parent().parent()
    const orderStatus = parent.find('.orderStatus')
    const paymentStatus = parent.find('.paymentStatus')
    const cancelBtn = parent.find(".orderCancelBtn")
    console.log(orderId)
    $.ajax({
      url: '/cart/order/return',
      method: "PATCH",
      data: { orderId },
      success: function (data) {
        if (data?.order) {
          button.hide()
          cancelBtn.show()
          let paymentStatusClassValue = 'px-3 rounded-pill text-white paymentStatus bg-warning'
          if (data.order.paymentStatus === 'Completed') {
            paymentStatusClassValue = 'px-3 rounded-pill text-white paymentStatus bg-success'
          }

          orderStatus
            .text(data.order.orderStatus)
            .removeClass()
            .addClass("px-3 rounded-pill text-white orderStatus bg-warning")
          
          paymentStatus
            .text(data.order.paymentStatus)
            .removeClass()
            .addClass(paymentStatusClassValue)
          showAlert(data.message)
        } else {
          console.log("invalid data")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }

    })
    console.log(orderId)
  }

  // * style order and payment states, hide cancel and return btn
  orderStatus.each(function () {
    const element = $(this)
    const elementValue = element.text().trim()
    const parent = element.parent().parent()
    const cancelBtn = parent.find('.orderCancelBtn')
    const returnBtn = parent.find('.orderReturnBtn')
    returnBtn.hide()

    switch (elementValue) {
      case 'Pending':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-warning")
        break;
      case 'Processing':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-warning")
        break;
      case 'Shipped':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-info")
        break;
      case 'Delivered':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-success")
        cancelBtn.hide()
        returnBtn.show()
        break;
      case 'Cancelled':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-danger")
        cancelBtn.hide()
        break;
      case 'Return Requested':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-warning")
        cancelBtn.show()
        break
      case 'Return Approved':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-warning")
        returnBtn.hide()
        cancelBtn.hide()
        break
      case 'Returned':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-primary")
        returnBtn.hide()
        cancelBtn.hide()
        break
      default:
        console.log("invalid order status value")
    }
  })

  paymentStatus.each(function () {
    const element = $(this)
    const elementValue = element.text().trim()
    switch (elementValue) {
      case 'Pending':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white paymentStatus bg-warning")
        break;
      case 'Completed':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white paymentStatus bg-success")
        break;
      case 'Failed':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white paymentStatus bg-danger")
        break;
      case 'Refunded':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white paymentStatus bg-info")
        break;
      default:
        console.log("invalid payment status value")
    }
  })
  // * style order and payment states end

  // * createdAt to readable date string
  createdAt.each(function () {
    const element = $(this)
    const elementValue = element.text().trim()
    const date = new Date(elementValue)
    const day = date.toDateString().split(' ')[0];
    const month = date.toDateString().split(' ')[1];
    const dateOfMonth = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    const formattedDate = `${day} ${month} ${dateOfMonth} ${year} ${hour}hr:${minute}min`;
    element.text(formattedDate)
  })



})