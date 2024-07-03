$(function () {

  const dropDownNumber = $(".dropdownNumber")

  dropDownNumber.on("click", handleCartItemQty)


  function handleCartItemQty() {
    const quantity = $(this).attr("data-quantity")
    const currentQuantity = $(this).attr("data-currentQuantity")
    const productId = $(this).attr("data-productId")
    console.log(quantity)

    if (currentQuantity === quantity) {
      return
    }
    const dropDown = $(this).parent().parent().parent()
    const cardBody = dropDown.parent().parent()
    const price = cardBody.find('#price')
    const dropDownBtn = dropDown.find("#dropdownQuantityBtn")

    let cart = {}
    $.ajax({
      url: '/cart/updateqty',
      method: 'PATCH',
      data: { productId, quantity },
      success: function (data) {
        if (data?.cart) {
          dropDownBtn.text(quantity)
          for (const product of data.cart.products) {
            if (product.productId === productId) {
              price.text(`₹${product.price}`)
            }
          }
        } else {
          console.log("data no found")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
    
  }




})