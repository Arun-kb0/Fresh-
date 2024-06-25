$(function () {

  const deleteProductBtn = $(".deleteProductBtn")
  const productForm = $("#formProduct")
  const image = $("#upload")

  const imageContainer = $(".imageContainer")
  const imageOuterContainer = $("#imageOuterContainer")


  deleteProductBtn.on("click", deleteProductHelper)
  productForm.on("submit", CreateOrEditProductHelper)
  image.on("input", handleImageView)

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