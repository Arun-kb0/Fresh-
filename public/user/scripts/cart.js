$(function () {

  // * event delegation for dynamically added btn
  $(document).on('click', '.addToCartBtn', handleAddToCart);


  // * add to cart btn 
  const addToCartBtn = $(".addToCartBtn")

// * cart btns
  const dropDownNumber = $(".dropdownNumber")
  const deleteCartItemBtn = $(".deleteCartItemBtn")
  const priceDetails = $("#priceDetails")

  // * add to cart event 
  addToCartBtn.on("click", handleAddToCart)

  dropDownNumber.on("click", handleCartItemQty)
  deleteCartItemBtn.on("click", handleCartItemDelete)


  function handleCartItemDelete() {
    const productId = $(this).attr('data-productId')
    $.ajax({
      url: '/cart/deleteitem',
      method: 'DELETE',
      data: { productId },
      success: function (data) {
        console.log(data)
        window.location.reload()
      },
      error: function (xhr, status, error) {
        console.log(error)
      }
    })
  }


  // * update cart quantity
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



// * add to cart btn 
  function handleAddToCart(event) {
    const productId = $(this).attr("data-id")
    console.log(productId)
    console.log(event)
    $.ajax({
      url: '/cart/',
      method: 'PATCH',   
      data: { productId },
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