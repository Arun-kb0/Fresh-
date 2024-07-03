$(function () {

  const addToCartBtn = $(".addToCartBtn")

  console.log(addToCartBtn)

  addToCartBtn.on("click", handleAddToCart)


  function handleAddToCart() {
    const productId = $(this).attr("data-id")
    $.ajax({
      url: '/cart/',
      method: 'PATCH',
      data: {productId},
      success: function (data) {
        console.log(data)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })

  }

})