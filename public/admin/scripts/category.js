$(function () {
  const deleteCategoryBtn = $(".deleteCategoryBtn")
  const deleteSubCategoryBtn = $(".deleteSubCategoryBtn")
  const formCategory = $("#formCategory")
  const image = $("#upload")[0]



  deleteCategoryBtn.on("click", deleteCategoryHelper)
  deleteSubCategoryBtn.on("click", deleteCategoryHelper)
  formCategory.on("submit", updateOrCreateCategory)



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
        alert(data.message)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(error)
      }
    })
  }



  // function updateOrCreateCategory(e) {
  //   e.preventDefault()
  //   const formData = $(this).serializeArray()
  //   let formObject = {}
  //   formData.forEach((item) => {
  //     formObject[item.name] = item.value.trim()
  //   })
  //   console.log(formObject)
  //   let url, method
  //   if (isEdit) {
  //     url = '/admin/category/edit'
  //     method = 'PATCH'
  //   } else {
  //     url = '/admin/category/create'
  //     method = "POST"
  //   }

  //   $.ajax({
  //     url: url,
  //     method: method,
  //     data: JSON.stringify(formObject),
  //     contentType: "application/json",
  //     success: function (data) {
  //       console.log(data)
  //       alert(data.message)
  //     },
  //     error: function (xhr, status, error) {
  //       const res = JSON.parse(xhr.responseText)
  //       alert(res.message)
  //       console.log(error)
  //     }
  //   })
  // }


  function deleteCategoryHelper() {
    const categoryId = this.getAttribute("data-item")
    console.log(categoryId)
    $.ajax({
      url: `/admin/category/edit?categoryId=${categoryId}`,
      method: "DELETE",
      success: function (data) {
        console.log(data)
        alert(data.message)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(error)
      }
    })
  }


})