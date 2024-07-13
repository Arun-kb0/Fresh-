$(function () {

  const image = $("#upload")
  const formCoupon = $('#formCoupon')
  const name = $("#name")
  const discountValue = $("#discountValue")
  const submitBtn = $("#submitBtn")
  const startDate = $("#startDate")
  const endDate = $("#endDate")

  const discountType = $("#discountType")
  const couponDropdown = $("#couponDropdown")

  const categoryDropdown = $("#categoryDropdown")
  const subcategoryDropdown = $("#subcategoryDropdown")
  const productDropdown = $("#productDropdown")


  name.on('input', checkOfferName)
  discountValue.on('input', checkDiscountValue)
  formCoupon.on("submit", handleSubmit)
  

  function handleSubmit(e) {
    e.preventDefault
    if (!checkOfferName(name)
      || !checkDiscountValue(discountValue)
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
        if (item.name === 'name') {
          formObject[item.name] = item.value.trim().toLowerCase()
        }
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
      url: '/admin/offer/create',
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



  // * validation checks
  function checkOfferName(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      const inputValue = input.val().trim()
      if (inputValue === "") {
        setErrorFor(input, "cannot be empty")
        return false
      } else if (!isDiscountName(inputValue)) {
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

  function checkDiscountValue(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      const inputValue = input.val().trim()
      if (inputValue === "") {
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

  // * validation checks end


  // * dropdowns
  productDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      const productId = $(this).attr('data-id')
      if (!productId) {
        $('#productDropdownBtn').text("");
        $('#productDropdownBtn').text("select product");
        $("#product").val(null)
        return
      }
      $('#productDropdownBtn').text("");
      $('#productDropdownBtn').text(name);
      $("#product").val(productId)
    });

  subcategoryDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      const subcategoryId = $(this).attr('data-id')
      if (!subcategoryId) {
        $('#subcategoryDropdownBtn').text("");
        $('#subcategoryDropdownBtn').text("select subcategory");
        $("#subcategory").val(null)
        return
      }
      $('#subcategoryDropdownBtn').text("");
      $('#subcategoryDropdownBtn').text(name);
      $("#subcategory").val(subcategoryId)
    });

  categoryDropdown.find('.dropdown-item').on('click',
    function () {
      const name = $(this).text().trim();
      const categoryId = $(this).attr('data-id')
      if (!categoryId) {
        $('#categoryDropdownBtn').text("");
        $('#categoryDropdownBtn').text("select category");
        $("#category").val(null)
        return
      }
      $('#categoryDropdownBtn').text("");
      $('#categoryDropdownBtn').text(name);
      $("#category").val(categoryId)
    });

  couponDropdown.find('.dropdown-item').on('click',
    function () {
      const discount = $(this).text().trim();
      console.log(discountType)
      $('#couponDropdownBtn').text("");
      $('#couponDropdownBtn').text(discount);
      $("#discountType").val(discount)
    });

  // * dropdowns end 

  // * date picker init
  $("#datepicker").datepicker({
    autoclose: true,
    todayHighlight: true,
  }).datepicker('update', new Date());

  $("#datepicker2").datepicker({
    autoclose: true,
    todayHighlight: true,
  }).datepicker('update', new Date());
  // * date picker init end



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


  // * regex
  function isNumber(price) {
    const priceRegex = /^[1-9][0-9]*$/;
    return priceRegex.test(price)
  }
  function isDiscountName(flat) {
    const discountNameRegex = /^[A-Za-z0-9\s%-]+$/;
    return discountNameRegex.test(flat);
  }

})