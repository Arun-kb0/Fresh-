$(function () {

  const deleteProductBtn = $(".deleteProductBtn")
  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")
  
  
  deleteProductBtn.on("click", deleteProductHelper)
  nextBtn.on("click", handleNext)
  prevBtn.on("click", handlePrev)


  // * pagination
  let { page, numberOfPages } = pageDetails
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
      window.location.href = `/admin/products?page=${page}`
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      window.location.href = `/admin/products?page=${page}`
    }
  }
  // * pagination end

  // * delete product
  function deleteProductHelper() {
    const productId = this.getAttribute("data-item")
    console.log(productId)
    $.ajax({
      url: `/admin/product/edit?productId=${productId}`,
      method: "DELETE",
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

})