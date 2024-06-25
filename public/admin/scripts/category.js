$(function () {
  const deleteCategoryBtn = $(".deleteCategoryBtn")
  const deleteSubCategoryBtn = $(".deleteSubCategoryBtn")
  const formCategory = $("#formCategory")
  const image = $("#upload")[0]

  const imageContainer = $(".imageContainer")
  const imageOuterContainer = $("#imageOuterContainer")
  const bsAlert = $("#bsAlert")



  deleteCategoryBtn.on("click", deleteCategoryHelper)
  deleteSubCategoryBtn.on("click", deleteCategoryHelper)
  formCategory.on("submit", updateOrCreateCategory)
  image.on("input", handleImageView)

// * image preview
  function handleImageView() {
    if (this.files) {
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

    console.log(image)

    e.preventDefault()
    const formData = $(this).serializeArray()
    let formObject = {}
    formData.forEach((item) => {
      if (item.value !== "") {
        formObject[item.name] = item.value.trim()
      }
    })
    const file = image.files[0]
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

  function deleteCategoryHelper() {
    const categoryId = this.getAttribute("data-item")
    console.log(categoryId)
    $.ajax({
      url: `/admin/category/edit?categoryId=${categoryId}`,
      method: "DELETE",
      success: function (data) {
        console.log(data)
        showAlert(data.message)
        // alert(data.message)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
        // alert(res.message)
      }
    })
  }

  // * show alert function
  function showAlert(message) {
    bsAlert
      .removeClass('d-none')
      .text(message)

    setTimeout(() => {
      bsAlert.addClass('d-none')
    }, 10000 * 1)
  }






})