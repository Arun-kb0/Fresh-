$(function () {
  appliedCoupon

  let addressId = ''
  let paymentMethod = 'cod'
  let addressTitle = 'Address 1'

  const addressRadioBtn = $("#addressRadioBtn")
  const paymentRadioBtn = $("#paymentRadioBtn")

  const priceDetailsPaymentMethod = $("#priceDetailsPaymentMethod")
  const priceDetailsAddress = $("#priceDetailsAddress")
  const showPaymentSectionBtn = $('#showPaymentSectionBtn')
  const showAddressSectionBtn = $("#showAddressSectionBtn")

  const couponBtn = $("a.couponBtns")
  const removeCouponBtn = $("#removeCouponBtn")

  const selectPaymentBtn = $("#selectPaymentBtn")
  const selectAddressBtn = $("#selectAddressBtn")
  const paymentBtn = $(".paymentBtn")
  const paypalSection = $("#paypalSection")

  const applyCouponBtn = $("#applyCouponBtn")

  showAppliedCoupon()
  paypalSection.hide()

  removeCouponBtn.on('click', handleRemoveCoupon)
  couponBtn.on("click", enterCouponCode)
  applyCouponBtn.on("click", handleCoupon)
  paymentBtn.on("click", handlePayment)

  priceDetailsAddress.text(addressTitle)
  priceDetailsPaymentMethod.text(paymentMethod)

  // * payment and address section scroll on click
  // * payment Details container btn
  showPaymentSectionBtn.on('click', scrollToPaymentSection)
  showAddressSectionBtn.on('click', scrollToAddress)


  selectPaymentBtn.on("click", function () {
    const checkedRadioButton = $('input[name="paymentRadioBtn"]:checked')
    paymentMethod = checkedRadioButton.next('label').attr('name').trim()
    const title = checkedRadioButton.attr('data-title')
    priceDetailsPaymentMethod.text(paymentMethod)
    showAlert(`payment method ${title} selected`)
    console.log(paymentMethod)
  })

  selectAddressBtn.on("click", function () {
    const checkedRadioButton = $('input[name="addressRadioBtn"]:checked');
    addressId = checkedRadioButton.attr('data-addressId').trim();
    addressTitle = checkedRadioButton.attr('data-title');
    priceDetailsAddress.text(addressTitle)
    showAlert(`${addressTitle} selected`)
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
    const showingCouponBtn = couponBtn.attr('name', code)

    $.ajax({
      url: "/cart/checkout",
      method: 'POST',
      data: { code, total: totalValue },
      success: function (data) {
        if (data) {
          appliedCoupon = data.coupon
          input.val('')
          showAlert(data.message)
          total.text(`${data.finalTotal}`)
          coupon.parent().removeClass('d-none')
          const couponValue = (data.coupon.discountType === 'percentage')
            ? `${data.coupon.discountValue}% OFF`
            : `₹${data.coupon.discountValue} OFF`
          coupon.text(couponValue)

          prevTotal.parent().removeClass('d-none')
          prevTotal.text(totalValue)
          showingCouponBtn
            .removeClass('d-flex')
            .addClass('d-none')
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

  function handleRemoveCoupon() {
    if (!appliedCoupon) {
      console.log('no coupon is applied')
      return
    }
    const couponId = appliedCoupon._id
    const code = appliedCoupon.code
    const showingCouponBtn = couponBtn.attr('name', code)
    const appliedCouponParent = $(this).parent()
    const prevTotal = $("#prevTotal")
    const total = $('#total')


    console.log(code)
    console.log(showingCouponBtn)

    $.ajax({
      url: '/cart/checkout/coupon/remove',
      method: 'PATCH',
      data: { couponId },
      success: function (data) {
        if (!data) {
          console.log('no data found')
          return
        }
        showAlert(data.message)
        total.text(`${data?.cart.total}`)
        prevTotal.parent().addClass('d-none')
        appliedCouponParent
          .removeClass('d-flex')
          .addClass('d-none')
        showingCouponBtn
          .removeClass('d-none')
          .addClass('d-flex')
        console.log(showingCouponBtn.html())
      },
      error: function (xhr, status, error) {
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

    if (paymentMethod === 'paypal') {
      scrollToPaypalSection()
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


  function enterCouponCode() {
    const couponInput = applyCouponBtn.parent().find('input')
    const code = $(this).attr('data-code')
    couponInput.val(code)
    console.log(code)
  }

  function showAppliedCoupon() {
    if (appliedCoupon) {
      const showingCouponBtn = couponBtn.attr('name', applyCouponBtn.code)
      const total = $('#total')
      const coupon = $("#coupon")
      coupon.parent().removeClass('d-none')
      const couponValue = (appliedCoupon?.discountType === 'percentage')
        ? `${appliedCoupon.discountValue}% OFF`
        : `₹${appliedCoupon.discountValue} OFF`
      coupon.text(couponValue)

      total.text()
      showingCouponBtn.remove()
    }
  }

  // * scroll functions
  function scrollToPaymentSection() {
    const offset = 200
    $('html, body').animate({
      scrollTop: $('#paymentMethodContainer').offset().top - offset
    }, 500)
  }

  function scrollToAddress() {
    const offset = 250
    $('html, body').animate({
      scrollTop: $('#addressContainer').offset().top - offset
    }, 500)
  }

  function scrollToPaypalSection() {
    const offset = 500
    $('html, body').animate({
      scrollTop: $('#paypalSection').offset().top - offset
    }, 500)
  }

  // * scroll functions end


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
            body: JSON.stringify({ addressId })
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
            body: JSON.stringify({ ...data, addressId })
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