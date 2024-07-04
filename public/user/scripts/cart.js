$(function () {

  const dropDownNumber = $(".dropdownNumber")
  const priceDetails = $("#priceDetails")


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

    const totalItems = priceDetails.find("#totalItems")
    const subTotal = priceDetails.find("#subTotal")
    const total = priceDetails.find("#total")
    const deliveryFee = priceDetails.find("#deliveryFee")

    // let totalItemsValue = parseInt(totalItems.text())
    // let subTotalValue = parseInt(subTotal.text())
    let deliveryFeeValue = parseInt(deliveryFee.text())
    let totalValue = parseInt(total.text())

    console.log(totalValue)
    console.log(total.html())
    console.log(deliveryFeeValue)

    $.ajax({
      url: '/cart/updateqty',
      method: 'PATCH',
      data: { productId, quantity },
      success: function (data) {
        if (data?.cart) {
          dropDownBtn.text(quantity)
          let totalItemsValue=0
          let subTotalValue =0
          for (const product of data.cart.products) {
            if (product.productId === productId) {
              price.text(`₹${product.price}`)
            }
            totalItemsValue += 1
            subTotalValue+= product.price
          }
          totalItems.text(totalItemsValue)
          subTotal.text(subTotalValue)
          total.text(deliveryFeeValue + subTotalValue)
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