$(function () {

  const deleteProductBtn = $(".deleteProductBtn")
  const productForm = $("#formProduct")
  const imageUploadBtn = $("#productImageUpload")
  const image = $("#upload")[0]


  deleteProductBtn.on("click", deleteProductHelper)
  // productForm.on("submit", CreateOrEditProductHelper)

  productForm.on("submit", function (e) {
    e.preventDefault()
    const formData = $(this).serializeArray()
    let formObject = {}
    formData.forEach((item) => {
      if (item.value !== "") {
        formObject[item.name] = item.value.trim()
      }
    })
    // !
    const file = image.files[0]
    const formDataObject = new FormData()

    for (const key in formObject) {
      formDataObject.append(key, formObject[key]);
    }
    formDataObject.append("filename", file)

    // const combinedData = {
    //   formData: formDataObject,
    //   jsonData: formObject
    // }
    // !

    let url, method
    if (isEdit) {
      url = '/admin/product/edit'
      method = 'PATCH'
    } else {
      url = '/admin/product/create'
      method = "POST"
    }

    // console.log(combinedData)
    $.ajax({
      url: url,
      method: method,
      data: formDataObject,
      processData:false,
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
  })




  function CreateOrEditProductHelper(e) {
    e.preventDefault()
    const formData = $(this).serializeArray()
    let formObject = {}
    formData.forEach((item) => {
      if (item.value !== "") {
        formObject[item.name] = item.value.trim()
      }
    })
    console.log(formObject)

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
      data: JSON.stringify(formObject),
      contentType: "application/json",
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

  function deleteProductHelper() {
    const productId = this.getAttribute("data-item")
    console.log(productId)
    $.ajax({
      url: `/admin/product/edit?productId=${productId}`,
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