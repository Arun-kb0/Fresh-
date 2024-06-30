
$(function () {
  const formCategory = $("#formCategory")
  const image = $("#upload")
  const name = $("#Name")
  const slug = $("#slug")
  const id = $("#id")
  const parentId = $("#parentId")
  const subCategoryName = $("#subCategory")
  const submitBtn = $("#submitBtn")

  const imageContainer = $(".imageContainer")
  const imageOuterContainer = $("#imageOuterContainer")
  const showCategoryDropdown = $("#showCategoriesDropdownBtn")
  const categoryDropdown = $("#categoryDropdown")


  name.on("input", checkName)
  subCategoryName.on("input",checkSubCategoryName)
  slug.on("input", checkSlug)
  id.on("input", checkId)
  parentId.on("input", checkParentId)
  formCategory.on("submit", updateOrCreateCategory)
  image.on("input", handleImageView)
  categoryDropdown.find('.dropdown-item').on("click", handleCategoryDropdown)


  function checkId() {
    const idValue = id.val().trim()
    console.log(idValue.length)
    if (idValue.length === 0) {
      setSuccessFor(id)
      return true
    } else if (idValue.length !== 24) {
      setErrorFor(id, "invalid id")
      return false
    } else {
      setSuccessFor(id)
      return true
    }
  }


  function checkParentId() {
    const parentIdValue = parentId.val().trim()
    console.log(parentIdValue.length)
    if (parentIdValue.length === 0) {
      setSuccessFor(parentId)
      return true
    }else if (parentIdValue.length!==24) {
      setErrorFor(parentId,"invalid parentId")
      return false
    } else {
      setSuccessFor(parentId)
      return true
    }
  }

  function checkSlug() {
    const slugValue = slug.val().trim()
    console.log(slugValue.length)
    if (slugValue.length === 0) {
      setSuccessFor(slug)
      return true
    }else if (!isSlug(slugValue)) {
      setErrorFor(slug, "invalid slug name")
      return false
    } else {
      setSuccessFor(slug)
      return true
    }
  }

  function checkName() {
    console.log(name.val())
    const nameValue = name.val().trim()
    if (name === "") {
      setErrorFor(name, "cannot be empty")
      return false
    } else if (!isName(nameValue)) {
      setErrorFor(name, "invalid category name")
      return false
    } else {
      setSuccessFor(name)
      return true
    }
  }

  function checkSubCategoryName() {
    const subCategoryNameValue = subCategoryName.val().trim()
    const parentIdValue = parentId.val().trim()
    if (parentIdValue.length !== 24) {
      setSuccessFor(subCategoryName)
      return true
    }else if (subCategoryName === "") {
      setErrorFor(subCategoryName, "cannot be empty")
      return false
    } else if (!isName(subCategoryNameValue)) {
      setErrorFor(subCategoryName, "invalid category subCategoryName")
      return false
    } else {
      setSuccessFor(subCategoryName)
      return true
    }
  }


  // * drop down
  function handleCategoryDropdown() {
    const selectedCategory = $(this).text();
    const selectedCategoryId = $(this).attr("data-item")
    console.log(selectedCategory)
    $('#showCategoriesDropdownBtn').text("");
    $('#showCategoriesDropdownBtn').text(selectedCategory);
    $("#parentId").val(selectedCategoryId)
    $("#Name").val(selectedCategory.trim())
  };

  // * image preview
  function handleImageView() {
    if (this.files) {
      console.log(this?.files[0])
      imageOuterContainer.empty();
      const imageUrl = URL.createObjectURL(this.files[0])
      const img = $('<img>')
        .attr('src', imageUrl)
        .addClass('d-block shadow p-1 mx-1 rounded')
        .css({ height: '100px', width: '100px' });
      imageOuterContainer.append(img);
    }
  }

  // * update or create
  function updateOrCreateCategory(e) {
    if (!checkName() || !checkId() || !checkParentId() || !checkSlug()) {
      setErrorFor("invalid fields")
    }
    console.log(image)

    e.preventDefault()
    const formData = $(this).serializeArray()
    let formObject = {}
    formData.forEach((item) => {
      if (item.value !== "") {
        formObject[item.name] = item.value.trim()
      }
    })
    const file = image[0].files[0]
    const formDataObject = new FormData()
    for (const key in formObject) {
      formDataObject.append(key, formObject[key]);
    }
    formDataObject.append("filename", file)
    console.log(formDataObject)

    let url, method
    if (isEdit) {
      url = '/admin/category/edit'
      method = 'PATCH'
    } else {
      url = '/admin/category/create'
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
    console.log(input.val())
    let parent
    if (input.attr("name") === "password") {
      parent = input.parent().parent()
    } else {
      parent = input.parent()
    }
    const small = parent.find("#small")
    small.removeClass()
    small.addClass("text-danger opacity-1")
    small.text(msg)
    submitBtn.prop("disabled", true)
  }

  // * validation success function
  function setSuccessFor(input) {
    let parent
    if (input.attr("name") === "password") {
      parent = input.parent().parent()
    } else {
      parent = input.parent()
    }
    const small = parent.find("#small")
    small.text("")
    small.removeClass()
    small.addClass("opacity-0")
    submitBtn.prop("disabled", false)
    console.log(` validation success`)
  }


  // * regex functions
  function isName(name) {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name)
  }

  function isSlug(slug) {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(slug)
  }


})