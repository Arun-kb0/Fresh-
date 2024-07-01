$(function () {

  const name = $("#Name")
  const subCategory = $("#subCategory")
  const subCategoryId = $("#subCategoryId")
  const id = $("#id")
  const price = $("#price")
  const finalPrice = $("#finalPrice")
  const rating = $("#rating")
  const peopleRated = $("#peopleRated")
  const stock = $("#stock")
  const description = $("#description")
  const featuresAndDetails = $("#featuresAndDetails")
  const brand = $("#brand")
  const soldBy = $("#soldBy")
  const location = $("#location")
  const submitBtn = $("#submitBtn")

  const productForm = $("#formProduct")
  const image = $("#upload")
  const imageContainer = $(".imageContainer")
  const deleteImageBtn = $(".deleteImageBtn")
  const imageOuterContainer = $("#imageOuterContainer")
  const categoryDropdown = $("#categoryDropdown")


  peopleRated.on("input", checkPeopleRated)
  rating.on("input", checkRating)
  price.on("input", checkPriceAndFinalPrice)
  stock.on("input", checkPriceAndFinalPrice)
  finalPrice.on("input", checkPriceAndFinalPrice)
  id.on("input", checkIds)
  subCategoryId.on("input", checkIds)
  name.on("input", checkNameAndSubCategory)
  subCategory.on("input", checkNameAndSubCategory)
  brand.on("input", checkProductInfo)
  featuresAndDetails.on("input", checkProductInfo)
  soldBy.on("input", checkProductInfo)
  location.on("input", checkProductInfo)


  productForm.on("submit", CreateOrEditProductHelper)
  image.on("input", handleImageView)
  deleteImageBtn.on("click", handleImageDelete)




  // * validations
  function checkRating(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      console.log(input.val())
      const inputValue = input.val().trim()
      if (inputValue.length === 0) {
        setSuccessFor(input)
        return true
      } else if (!isRating(inputValue)) {
        setErrorFor(input, `invalid ${input.attr("name")}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }

  }

  function checkPeopleRated(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      console.log(input.val())
      const inputValue = input.val().trim()
      if (inputValue.length === 0) {
        setSuccessFor(input)
        return true
      } else if (!isPeopleRated(inputValue)) {
        setErrorFor(input, `invalid ${input.attr("name")}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }

  }

  function checkPriceAndFinalPrice(eventOrElement) {
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
      } else if (!isPrice(inputValue) || parseInt(inputValue) === 0) {
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

  function checkIds(eventOrElement) {
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
      } else if (inputValue.length !== 24) {
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

  function checkNameAndSubCategory(eventOrElement) {
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
      } else if (!isName(inputValue)) {
        setErrorFor(input, `invalid ${input.attr("name")}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }
  }

  function checkProductInfo(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      console.log(input.val())
      const inputValue = input.val().trim()
      if (inputValue.length === 0) {
        setSuccessFor(input)
        return true
      } else if (!isName(inputValue)) {
        setErrorFor(input, `invalid ${input.attr("name")}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }

  }


  // * validations end


  // * delete image
  function handleImageDelete() {
    const imageId = $(this).attr("data-item")

    console.log(`click ${imageId}`)

    $.ajax({
      url: `/admin/product/image?imageId=${imageId}`,
      method: "DELETE",
      success: function (data) {
        console.log(data)
        $(`.image-container[data-image-id='${imageId}']`).remove();
        showAlert(data.message)
      },
      error: function (xhr, status, error) {
        console.log(error.message)
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
      }
    })

  }

  categoryDropdown.find('.dropdown-item')
    .on('click', function () {
      const selectedCategory = $(this).text();
      const selectedCategoryId = $(this).attr("data-item")
      console.log(selectedCategory)
      $('#showCategoriesDropdownBtn').text("");
      $('#showCategoriesDropdownBtn').text(selectedCategory);
      $("#subCategoryId").val(selectedCategoryId)
      $("#subCategory").val(selectedCategory.trim())
    });


  function handleImageView() {
    if (this.files) {
      imageOuterContainer.empty();
      for (let i = 0; i < this.files.length; i++) {
        if (i > 4) break
        const imageUrl = URL.createObjectURL(this.files[i])
        const img = $('<img>')
          .attr('src', imageUrl)
          .addClass('d-block shadow p-1 mx-1 rounded')
          .css({ height: '100px', width: '100px' });
        imageOuterContainer.append(img);
      }
    }
  }


  function CreateOrEditProductHelper(e) {
    e.preventDefault()
    if (
      !checkNameAndSubCategory(name) || !checkNameAndSubCategory(subCategory)
      || !checkRating(rating) || !checkPeopleRated(peopleRated)
      || !checkPriceAndFinalPrice(price) || !checkPriceAndFinalPrice(finalPrice)
      || !checkProductInfo(brand) || !checkProductInfo(featuresAndDetails) 
      || !checkProductInfo(soldBy) || !checkProductInfo(location)
      || !checkPriceAndFinalPrice(stock)
    ) {
      showAlert('invalid fields')
      return
    }

    const formData = $(this).serializeArray()
    let formObject = {}
    formData.forEach((item) => {
      if (item.value !== "") {
        formObject[item.name] = item.value.trim()
      }
    })
    // const file = image.files[0]
    const formDataObject = new FormData()
    for (const key in formObject) {
      formDataObject.append(key, formObject[key]);
    }
    // formDataObject.append("filename", file)

    const files = image[0].files
    for (const file of files) {
      formDataObject.append('filename', file)
    }
    console.log(formDataObject)

    let url, method
    if (isEdit) {
      url = '/admin/product/edit'
      method = 'PATCH'
    } else {
      url = '/admin/product/create'
      method = "POST"
    }

    $.ajax({
      url: url,
      method: method,
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



  // * regex functions
  function isName(name) {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name)
  }

  function isPrice(price) {
    const priceRegex = /^[1-9][0-9]*$/;
    return priceRegex.test(price)
  }

  function isPeopleRated(count) {
    const countRegex = /^[0-9]+$/
    return countRegex.test(count)
  }

  function isRating(rating) {
    const ratingRegex = /^[0-5]$/;
    return ratingRegex.test(rating)
  }



})