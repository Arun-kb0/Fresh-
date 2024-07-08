$(function () {

  const addressRadioBtn = $("#addressRadioBtn")
  const paymentRadioBtn = $("#paymentRadioBtn")


  const selectPaymentBtn = $("#selectPaymentBtn")
  const selectAddressBtn = $("#selectAddressBtn")
  const paymentBtn = $(".paymentBtn")

  paymentBtn.on("click", handlePayment)

  let addressId = ''
  let paymentMethod = ''
  selectPaymentBtn.on("click", function () {
    paymentMethod = $('input[name="paymentRadioBtn"]:checked')
      .next('label')
      .attr('name')
      .trim()
    console.log(paymentMethod)
  })

  selectAddressBtn.on("click", function () {
    addressId = $('input[name="addressRadioBtn"]:checked')
      .attr('data-addressId')
      .trim()
    console.log(addressId)
  })

// * cod, wallet .online payment check
  function handlePayment() {

    if (!addressId || !paymentMethod) {
      showAlert("select address and payment method")
      return
    }

    switch (paymentMethod) {
      case 'cod':
        placeOrderUsingCod(addressId)
        break
      case 'razorPay':
        // placeOrderUsingCod()
        break
      case 'wallet':
        // placeOrderUsingCod()
        break
      default:
        console.log("invalid payment option value")      
    }
  }

  // * order functions
  function placeOrderUsingCod(addressId) {
    $.ajax({
      url: '/cart/order/cod',
      method: 'POST',
      data: { addressId },
      success: function (data) {
        if (data.order) {
          console.log(data.order)
          window.location.href = '/profile/orders'
        } else {
          console.log('no order found')
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