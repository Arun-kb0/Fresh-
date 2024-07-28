$(function () {

  const orderStatus = $(".orderStatus")
  const paymentStatus = $('.paymentStatus')

  const singleOrderStatus = $(".singleOrderStatus")
  const orderStatusDropdown = $(".orderStatusDropdown")

  orderStatusDropdown.find('.Pending').on('click', updateSingleOrderStatus)
  orderStatusDropdown.find('.Processing').on('click', updateSingleOrderStatus)
  orderStatusDropdown.find('.Shipped').on('click', updateSingleOrderStatus)
  orderStatusDropdown.find('.Delivered').on('click', updateSingleOrderStatus)
  orderStatusDropdown.find('.Cancelled').on('click', updateSingleOrderStatus)


  function updateSingleOrderStatus() {
    const parent = $(this).parent().parent().parent()
    const orderId = $(this).attr("data-orderId")
    const productId = $(this).attr("data-productId")
    const value = $(this).text().trim()
    const btnSpanElement = parent.find(".paymentStatus")
    // btnSpanElement.empty()

    const data = {
      orderId,
      productId,
      status: value
    }
    console.log(data)
    $.ajax({
      url: '/admin/order/single/status',
      method: 'PATCH',
      data: data,
      success: function (data) {
        if (data) {
          btnSpanElement.text(value)
          console.log(data)
          window.location.reload()
        } else {
          console.log("invalid data")
        }
      },
      error: function (xhr, status, error) {
        if (xhr.status === 410) {
          updateOrderAjaxCall({ orderId, status: value })
          return
        } else if (xhr.status === 409) {
          window.location.reload()
          return
        }
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }


  // * style order and payment states, hide cancel and return btn
  orderStatus.each(function () {
    const element = $(this)
    const elementValue = element.text().trim()
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
        break;
      case 'Cancelled':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-danger")
        break;
      case 'Return Requested':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-warning")
        break
      case 'Return Approved':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-warning")
        break
      case 'Returned':
        element
          .removeClass()
          .addClass("px-3 rounded-pill text-white orderStatus bg-primary")
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

  singleOrderStatus.each(function () {
    const element = $(this).parent()
    changeOrderStatusStyle(element)
  })
  // * style order and payment states end

  function changeOrderStatusStyle(element) {
    const elementValue = element.text().trim()

    switch (elementValue) {
      case 'Pending':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-warning")
        break;
      case 'Processing':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-warning")
        break;
      case 'Shipped':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-info")
        break;
      case 'Delivered':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-success")
        break;
      case 'Cancelled':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-danger")
        break;
      case 'Return Requested':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-warning")
        break;
      case 'Return Approved':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-warning")
        break;
      case 'Returned':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white orderStatus bg-primary")
        break;


      default:
        console.log("invalid order status value")
    }
  }


  // * handle all orders call
  function updateOrderAjaxCall({ orderId, status }) {
    const data = { orderId, status, noCheck: true }
    $.ajax({
      url: '/admin/order/orderstatus',
      method: 'PATCH',
      data: data,
      success: function (data) {
        if (data) {
          console.log("status", status)
          console.log(data)
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