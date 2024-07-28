$(function () {

  const orderStatus = $(".orderStatus")
  const paymentStatus = $('.paymentStatus')
  const createdAt = $(".createdAt")
  const orderCancelBtn = $(".orderCancelBtn")
  const orderReturnBtn = $(".orderReturnBtn")

  const singleProductStatus = $(".singleProductStatus")
  const cancelSingleProductBtn = $(".cancelSingleProductBtn")
  const returnSingleProductBtn = $(".returnSingleProductBtn")


  orderCancelBtn.on("click", handleCancelOrder)
  orderReturnBtn.on("click", handleReturnOrder)

  cancelSingleProductBtn.on('click', handleCancelSingleOrder)
  returnSingleProductBtn.on('click', handleReturnSingleOrder)
  

  function handleCancelSingleOrder() {
    const productId = $(this).attr('data-productId')
    const orderId = $(this).attr('data-orderId')

    const parent = $(this).parent().parent()
    const currentSingleOrderStatus = parent.find('.singleProductStatus')
    const cancelBtn = $(this)
    const returnBtn = parent.find('.returnSingleProductBtn')
    const orderTotal = $("#orderTotal")

    $.ajax({
      url: '/cart/order/single/cancel',
      method: 'PATCH',
      data:{productId, orderId},
      success: function (data) {
        if (!data.order) {
          console.log('no data returned')
          return
        }
        console.log(data)
        currentSingleOrderStatus
          .text('Cancelled')
          .addClass('text-white bg-danger')
        
        cancelBtn.hide()
        returnBtn.hide()

        orderTotal.text(data.order?.total)
      },
      error: function (xhr, status, error) {
        if (xhr.status === 410) {
          cancelOrderAjaxCall({ orderId })
          return
        }
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }
  
  function handleReturnSingleOrder() {
    const productId = $(this).attr('data-productId')
    const orderId = $(this).attr('data-orderId')

    const parent = $(this).parent().parent()
    const currentSingleOrderStatus = parent.find('.singleProductStatus')
    const cancelBtn = $(this)
    const returnBtn = parent.find('.returnSingleProductBtn')
    const orderTotal = $("#orderTotal")

    console.log(productId)
    console.log(orderId)

    $.ajax({
      url: '/cart/order/single/return',
      method: 'PATCH',
      data: { productId, orderId },
      success: function (data) {
        if (!data) {
          console.log('no data returned')
          return
        }
        console.log(data)
        currentSingleOrderStatus
          .text('Return Requested')
          .addClass('text-white bg-warning')
        cancelBtn.hide()
        returnBtn.hide()
        orderTotal.text(data.order?.total)
      },
      error: function (xhr, status, error) {
        if (xhr.status === 410) {
          returnOrderAjaxCall({ orderId })
          return
        }
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }

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


  singleProductStatus.each(function () {
    const element = $(this)
    const elementValue = element.text().trim()
    const parent = element.parent().parent()
    const cancelBtn = parent.find('.cancelSingleProductBtn')
    const returnBtn = parent.find('.returnSingleProductBtn')
    returnBtn.hide()

    switch (elementValue) {
      case 'Pending':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-warning")
        break;
      case 'Processing':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-warning")
        break;
      case 'Shipped':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-info")
        break;
      case 'Delivered':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-success")
        cancelBtn.hide()
        returnBtn.show()
        break;
      case 'Cancelled':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-danger")
        cancelBtn.hide()
        break;
      case 'Return Requested':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-warning")
        cancelBtn.show()
        break
      case 'Return Approved':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-warning")
        returnBtn.hide()
        cancelBtn.hide()
        break
      case 'Returned':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white singleProductStatus bg-primary")
        returnBtn.hide()
        cancelBtn.hide()
        break
      default:
        console.log("invalid order status value")
    }
  })

  
  // * cancel order function call id all orders are cancelled
  function cancelOrderAjaxCall({orderId}) {
    $.ajax({
      url: '/cart/order/cancel',
      method: "PATCH",
      data: { orderId },
      success: function (data) {
        window.location.reload()
      },
      error: function (xhr, status, error) {
        console.log(error)
      }
    })

  }

  function returnOrderAjaxCall({ orderId }) {
    $.ajax({
      url: '/cart/order/return',
      method: "PATCH",
      data: { orderId },
      success: function (data) {
        if (data?.order) {
          window.location.reload()
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

})