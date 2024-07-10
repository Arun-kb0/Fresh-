$(function () {


  const image = $("#upload")
  const formCoupon = $('#formCoupon')
  const code = $("#code")
  const usageLimit = $("#usageLimit")
  const minCartAmount = $("#minCartAmount")
  const discountValue = $("#discountValue")
  const submitBtn = $("#submitBtn")
  const startDate = $("#startDate")
  const endDate = $("#endDate")

  const discountType = $("#discountType")
  const couponDropdown = $("#couponDropdown")

  code.on('input', checkCode)
  minCartAmount.on("input", checkAmountAndDiscount)
  discountValue.on("input", checkAmountAndDiscount)
  usageLimit.on("input", checkAmountAndDiscount)

  formCoupon.on("submit", handleCreateCoupon)



  function handleCreateCoupon(e) {
    e.preventDefault()
    console.log(discountType.val())
    if (!checkCode(code)
      || !checkAmountAndDiscount(discountValue)
      || !checkAmountAndDiscount(minCartAmount)
      || !checkAmountAndDiscount(usageLimit)
      || discountType.val() === ""
    ) {
      showAlert('invalid fields')
      return
    }

    const startDateValue = new Date(startDate.val())
    const endDateValue = new Date(endDate.val())
    const currentDateValue = new Date()
    currentDateValue.setHours(0, 0, 0, 0)
    if (!startDateValue || !endDateValue
      || startDateValue < currentDateValue
      || endDateValue < startDateValue
    ) {
      showAlert('invalid start and end date ')
      return
    }

    const formData = $(this).serializeArray()
    let formObject = {}
    formData.forEach((item) => {
      if (item.value !== "") {
        formObject[item.name] = item.value.trim()
      }
    })
    console.log(formData)
    const formDataObject = new FormData()
    for (const key in formObject) {
      formDataObject.append(key, formObject[key]);
    }
    const file = image[0].files[0]
    formDataObject.append('filename', file)

    $.ajax({
      url: '/admin/coupon/create',
      method: 'POST',
      data: formDataObject,
      processData: false,
      contentType: false,
      success: function (data) {
        console.log(data)
        showAlert(data.message)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })

  }

  // * drop down item
  couponDropdown.find('.dropdown-item').on('click',
    function () {
      const discount = $(this).text().trim();
      console.log(discountType)
      $('#couponDropdownBtn').text("");
      $('#couponDropdownBtn').text(discount);
      $("#discountType").val(discount)
    });



  function checkAmountAndDiscount(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      const inputValue = input.val().trim()
      if (input === "") {
        setErrorFor(input, "cannot be empty")
        return false
      } else if (!isNumber(inputValue) || parseInt(inputValue) === 0) {
        setErrorFor(input, `invalid ${input.attr('name')}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }
  }



  function checkCode(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      const inputValue = input.val().trim()
      if (input === "") {
        setErrorFor(input, "cannot be empty")
        return false
      } else if (inputValue.length < 5) {
        setErrorFor(input, `invalid ${input.attr('name')}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }
  }



  // * validation error function
  function setErrorFor(input, msg) {
    try {
      if (!input) return
      console.log(input.val())
      let parent = input.parent()
      const small = parent.find("#small")
      small.removeClass()
      small.addClass("text-danger opacity-1")
      small.text(msg)
      submitBtn.prop("disabled", true)
    } catch (error) {
      console.log(error)
    }
  }

  // * validation success function
  function setSuccessFor(input) {
    try {
      if (!input) return
      let parent = input.parent()
      const small = parent.find("#small")
      small.text("")
      small.removeClass()
      small.addClass("opacity-0")
      submitBtn.prop("disabled", false)
      console.log(` validation success`)
    } catch (error) {
      console.log(error)
    }
  }

  function isNumber(price) {
    const priceRegex = /^[1-9][0-9]*$/;
    return priceRegex.test(price)
  }


  // * date picker init
  $("#datepicker").datepicker({
    autoclose: true,
    todayHighlight: true,
  }).datepicker('update', new Date());

  $("#datepicker2").datepicker({
    autoclose: true,
    todayHighlight: true,
  }).datepicker('update', new Date());

})