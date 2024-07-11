$(function () {

  const addressRadioBtn = $("#addressRadioBtn")
  const paymentRadioBtn = $("#paymentRadioBtn")


  const selectPaymentBtn = $("#selectPaymentBtn")
  const selectAddressBtn = $("#selectAddressBtn")
  const paymentBtn = $(".paymentBtn")

  const applyCouponBtn = $("#applyCouponBtn")

  applyCouponBtn.on("click", handleCoupon)
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


  function handleCoupon() {
    const input = $(this).parent().find('input')
    const code = input.val().trim()
    console.log(code)
    const total = $('#total')
    const coupon = $('#coupon')
    const prevTotal = $("#prevTotal")
    const totalValue = parseFloat(total.text().trim())

    $.ajax({
      url: "/cart/checkout",
      method: 'POST',
      data: { code, total: totalValue },
      success: function (data) {
        if (data) {
          showAlert(data.message)
          total.text(`${data.finalTotal}`)
          coupon.parent().removeClass('d-none')
          const couponValue =  (data.coupon.discountType === 'percentage') 
            ? `${data.coupon.discountValue}% OFF`
            : `₹${data.coupon.discountValue} OFF`
          coupon.text(couponValue)

          prevTotal.parent().removeClass('d-none')
          prevTotal.text(totalValue)

        } else {
          console.log('apply coupon no data found')
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }

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