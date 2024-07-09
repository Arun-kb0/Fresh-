$(function () {
  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")

  const orderStatus = $(".orderStatus")
  const paymentStatus = $('.paymentStatus')
  const createdAt = $(".createdAt")

  const paymentStatusDropdown = $(".paymentStatusDropdown")
  const orderStatusDropdown = $(".orderStatusDropdown")


  nextBtn.on("click", handleNext)
  prevBtn.on("click", handlePrev)

  paymentStatusDropdown.find(".Pending").on("click", updatePaymentStatus)
  paymentStatusDropdown.find(".Completed").on("click", updatePaymentStatus)
  paymentStatusDropdown.find(".Failed").on("click", updatePaymentStatus)
  paymentStatusDropdown.find(".Refunded").on("click", updatePaymentStatus)

  orderStatusDropdown.find('.Pending').on('click',updateOrderStatus)
  orderStatusDropdown.find('.Processing').on('click',updateOrderStatus)
  orderStatusDropdown.find('.Shipped').on('click',updateOrderStatus)
  orderStatusDropdown.find('.Delivered').on('click',updateOrderStatus)
  orderStatusDropdown.find('.Cancelled').on('click',updateOrderStatus)



  function updateOrderStatus() {
    const parent = $(this).parent().parent().parent()
    const orderId = $(this).attr("data-orderId")
    const value = $(this).text().trim()
    const btnSpanElement = parent.find(".paymentStatus")
    btnSpanElement.empty()
    

    const data = {
      orderId,
      status: value
    }
    console.log(data)
    $.ajax({
      url: '/admin/order/orderstatus',
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
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }

// * update payment status
  function updatePaymentStatus() {
    const parent = $(this).parent().parent().parent()
    const orderId = $(this).attr("data-orderId")
    const value = $(this).text().trim()
    const btnSpanElement = parent.find(".paymentStatus")

    const data = {
      orderId,
      status: value
    }
    $.ajax({
      url: '/admin/order/paymentstatus',
      method: 'PATCH',
      data: data,
      success: function (data) {
        if (data) {
          btnSpanElement.empty()
          btnSpanElement.text(value)
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


    console.log("value", value)
    console.log("btnSpanElement value", btnSpanElement.text())
    // changePaymentStatusStyle(btnSpanElement);
    // const dropdownElement = parent.find('.dropdown-toggle')[0];
    // const bsDropdown = bootstrap.Dropdown.getInstance(dropdownElement);
    // bsDropdown.hide();
  }

  // * pagination
  let { page, numberOfPages } = pageDetails
  if (numberOfPages === page) {
    nextBtn.prop("disabled", true)
  }
  if (1 === page) {
    prevBtn.prop("disabled", true)
  }

  function handleNext() {
    console.log(page)
    if (numberOfPages > page) {
      page++
      console.log(page)
      window.location.href = `/admin/orders?page=${page}`
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      window.location.href = `/admin/orders?page=${page}`
    }
  }
  // * pagination end


  // * style order and payment states, hide cancel and return btn
  orderStatus.each(function () {
    const element = $(this).parent()
    console.log(element.html())
    changeOrderStatusStyle(element)
  })

  paymentStatus.each(function () {
    const element = $(this).parent()
    changePaymentStatusStyle(element)
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


  function changePaymentStatusStyle(element) {
    const elementValue = element.text().trim()
    console.log("elementValue")
    console.log(elementValue)
    switch (elementValue) {
      case 'Pending':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white paymentStatus bg-warning")
        break;
      case 'Completed':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white paymentStatus bg-success")
        break;
      case 'Failed':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white paymentStatus bg-danger")
        break;
      case 'Refunded':
        element
          .removeClass()
          .addClass("btn btn-sm dropdown-toggle text-white paymentStatus bg-info")
        break;
      default:
        console.log("invalid payment status value")
    }
  }

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

})