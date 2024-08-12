$(function () {

  let paymentMethod

  // * handling delegation
  $(document).on('click', '.starBtn', updateRating);
  $(document).on('input', '.reviewInput', updateReviewInput);

  const orderStatus = $(".orderStatus")
  const paymentStatus = $('.paymentStatus')
  const createdAt = $(".createdAt")
  const orderCancelBtn = $(".orderCancelBtn")
  const orderReturnBtn = $(".orderReturnBtn")

  const singleProductStatus = $(".singleProductStatus")
  const cancelSingleProductBtn = $(".cancelSingleProductBtn")
  const returnSingleProductBtn = $(".returnSingleProductBtn")
  const ratingBtn = $(".ratingBtn")
  const starBtn = $(".starBtn")
  const reviewInput = $(".reviewInput")

  const invoiceDownloadBtn = $("#invoiceDownloadBtn")
  const paymentMethodContainer = $("#paymentMethodContainer")
  const continuePaymentBtn = $("#continuePaymentBtn")
  const selectPaymentBtn = $("#selectPaymentBtn")
  const paypalSection = $("#paypalSection")


  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")

  prevBtn.on('click', handlePrev)
  nextBtn.on('click', handleNext)

  paymentMethodContainer.hide()
  paypalSection.hide()

  orderCancelBtn.on("click", handleCancelOrder)
  orderReturnBtn.on("click", handleReturnOrder)

  cancelSingleProductBtn.on('click', handleCancelSingleOrder)
  returnSingleProductBtn.on('click', handleReturnSingleOrder)

  invoiceDownloadBtn.on('click', handleDownloadInvoice)
  continuePaymentBtn.on('click', showPaymentSection)

  let rating = 0
  let review=''
  ratingBtn.on('click', handleViewRating)
  starBtn.on('click', updateRating)
  reviewInput.on('input', updateReviewInput)


  let productId
  function handleViewRating() {
    productId = $(this).attr('data-productId')
    // console.log(productId)

    Swal.fire({
      title: "<h4>Rate product</h4>",
      icon: "info",
      html: `
    <section class="col-12 ">
      <h5 id='starsCount-${productId}' class='text-primary' >0 Stars</h6>
      <div class='d-flex justify-content-center' >
				<div id='stars-${productId}'  class="d-flex pb-3" >
            <a data-value='1'  class='starBtn'> <i class="fa-regular fa-star fa-xl text-warning"></i> </a>
            <a data-value='2'  class='starBtn'> <i class="fa-regular fa-star fa-xl text-warning"></i> </a>
            <a data-value='3'  class='starBtn'> <i class="fa-regular fa-star fa-xl text-warning"></i> </a>
            <a data-value='4'  class='starBtn'> <i class="fa-regular fa-star fa-xl text-warning"></i> </a>
            <a data-value='5'  class='starBtn'> <i class="fa-regular fa-star fa-xl text-warning"></i> </a>
				</div>
      </div>
      <input id='reviewInput-${productId}'  class='form-control reviewInput' type='text' placeholder='add review' />
		</section>
  `,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: `Submit`,
      confirmButtonAriaLabel: "Thumbs up, great!",
      cancelButtonText: `Cancel`,
      cancelButtonAriaLabel: "Cancel",
      preConfirm: () => {
        submitReview();
      }
    });
  }

  function updateRating() {
    rating = $(this).attr('data-value')
    $(`#starsCount-${productId}`).text(`${rating} stars`)
  }
  function updateReviewInput() {
    review  = $(this).val().trim()
  }

  // ! do back end for updating rating
  function submitReview() {
    console.log(productId)
    console.log(rating)
    console.log(review)
    rating = 0
    review=''
    productId=''
  }

  // * pagination
  let numberOfPages = 0
  let page = 0
  if (pageDetails) {
    numberOfPages = pageDetails.numberOfPages
    page = pageDetails.page
  }

  if (numberOfPages === page) {
    nextBtn.prop("disabled", true)
  }
  if (1 === page) {
    prevBtn.prop("disabled", true)
  }

  function handleNext() {
    if (numberOfPages > page) {
      page++
      console.log(page)
      window.location.href = `/profile/orders?page=${page}`
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      window.location.href = `/profile/orders?page=${page}`
    }
  }
  // * pagination end


  function showPaymentSection() {
    paymentMethodContainer.toggle()
  }


  selectPaymentBtn.on("click", function () {
    const checkedRadioButton = $('input[name="paymentRadioBtn"]:checked')
    paymentMethod = checkedRadioButton.next('label').attr('name').trim()
    const title = checkedRadioButton.attr('data-title')
    showAlert(`payment method ${title} selected`)
    paypalSection.hide()
    // if (paymentMethod === 'paypal') {
    //   console.log(paypalSection.html())
    //   paypalSection.show()
    // }
    console.log(paymentMethod)
    switch (paymentMethod) {
      case 'cod':
        placeOrderUsingCod(addressId)
        break
      case 'wallet':
        // placeOrderUsingCod()
        break
      case 'paypal':
        paypalSection.show()
        break
      default:
        console.log("invalid payment option value")
    }
  })


  function handleDownloadInvoice() {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const orderId = urlParams.get('orderId')
    console.log(orderId)
    const url = `/profile/orderdetails?orderId=${orderId}&isInvoiceDownload=true`
    window.location.href = url
  }

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
      data: { productId, orderId },
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
    console.log(elementValue)
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
  function cancelOrderAjaxCall({ orderId }) {
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


  // * cod payment function
  function placeOrderUsingCod(addressId) {
    $.ajax({
      url: '/cart/order/cod',
      method: 'POST',
      data: { addressId, orderId, isContinuePayment: true },
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
  console.log(window.location.pathname)
  if (window.location.pathname === '/profile/orderdetails') {
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
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addressId, isContinuePayment: true, orderId })
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
            console.log("payment error catched on createOrder ")
            console.error(error);
            window.location.href = '/cart/order/failed'
          }
        },
        async onApprove(data, actions) {
          try {
            console.log(data)
            console.log(actions)
            const orderData = await actions.order.capture()
            const errorDetail = orderData?.details?.[0];
            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
              return actions.restart();
            } else if (errorDetail) {
              throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
            } else if (!orderData.purchase_units) {
              throw new Error(JSON.stringify(orderData));
            } else {
              const transaction =
                orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
                orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
              console.log(transaction)
              console.log(
                "Capture result",
                orderData,
                JSON.stringify(orderData, null, 2)
              );
              if (!transaction || transaction?.status !== "COMPLETED") {
                throw new Error(`payment capture ${transaction?.status}`)
              }

              const response = await fetch(`/cart/order/paypal/success`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, addressId, isContinuePayment: true, dbOrderId: orderId })
              });
              window.location.href = '/cart/order/success'
            }
          } catch (error) {
            console.log("payment error catched on onApprove ")
            console.error(error);
            const response = await fetch('/cart/order/paypal/failed', {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addressId, orderId })
            });
            window.location.href = '/cart/order/failed'
          }
        },
      })
      .render("#paypal-button-container");
  }


})