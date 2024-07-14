$(function () {

  const addressRadioBtn = $("#addressRadioBtn")
  const paymentRadioBtn = $("#paymentRadioBtn")


  const selectPaymentBtn = $("#selectPaymentBtn")
  const selectAddressBtn = $("#selectAddressBtn")
  const paymentBtn = $(".paymentBtn")
  const paypalSection = $("#paypalSection")

  const applyCouponBtn = $("#applyCouponBtn")

  paypalSection.hide()
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
      case 'paypal':
        paypalSection
          .removeClass('d-none')
          .addClass('d-flex')
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


  // * paypal code

  window.paypal
    .Buttons({
      style: {
        shape: "rect",
        layout: "vertical",
        color: "gold",
        label: "paypal",
      },
      message: {
        amount: 100,
      },
      async createOrder() {
        try {
          const response = await fetch("/cart/order/paypal", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({addressId})
          });

          const orderData = await response.json();
          console.log(orderData)
          if (orderData.id) {
            return orderData.id;
          }
          const errorDetail = orderData?.details?.[0];
          const errorMessage = errorDetail
            ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
            : JSON.stringify(orderData);

          throw new Error(errorMessage);
        } catch (error) {
          console.error(error);
          // resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`);
        }
      },
      async onApprove(data, actions) {
        try {
          await actions.order.capture()
          const response = await fetch(`/cart/order/paypal/success`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({...data, addressId})
          });

          console.log(data)
          const orderData = await response.json();
          showAlert(orderData.message)
          window.location.href = '/profile/orders'
          // // Three cases to handle:
          // //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
          // //   (2) Other non-recoverable errors -> Show a failure message
          // //   (3) Successful transaction -> Show confirmation or thank you message

          // const errorDetail = orderData?.details?.[0];

          // if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
          //   // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
          //   // recoverable state, per
          //   // https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
          //   return actions.restart();
          // } else if (errorDetail) {
          //   // (2) Other non-recoverable errors -> Show a failure message
          //   throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
          // } else if (!orderData.purchase_units) {
          //   throw new Error(JSON.stringify(orderData));
          // } else {
          //   // (3) Successful transaction -> Show confirmation or thank you message
          //   // Or go to another URL:  actions.redirect('thank_you.html');
          //   const transaction =
          //     orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          //     orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
          //   resultMessage(
          //     `Transaction ${transaction.status}: ${transaction.id}<br>
          // <br>See console for all available details`
          //   );
          //   console.log(
          //     "Capture result",
          //     orderData,
          //     JSON.stringify(orderData, null, 2)
          //   );
          // }
        } catch (error) {
          console.error(error);
          showAlert("payment failed try again")
          // resultMessage(
          //   `Sorry, your transaction could not be processed...<br><br>${error}`
          // );
        }
      },
    })
    .render("#paypal-button-container");


})