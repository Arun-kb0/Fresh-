$(function () {

  const pathsNeedDelegation = [
    '/'
  ]

  if (pathsNeedDelegation.includes(window.location.pathname)) {
    // * event delegation for dynamically added btn
    $(document).on('click', '.addToCartBtn', handleAddToCart);
    $(document).on('click', '.addToWishlistBtn', handleAddToWishlist);
  }


  // * add to cart btn 
  const addToCartBtn = $(".addToCartBtn")

  // * cart btns
  const addToWishlistBtn = $(".addToWishlistBtn")
  const deleteCartItemBtn = $(".deleteCartItemBtn")
  const priceDetails = $("#priceDetails")

  const incQtyBtn = $(".incQtyBtn")
  const decQtyBtn = $(".decQtyBtn")

  // * add to cart event 
  addToWishlistBtn.on('click', handleAddToWishlist)
  addToCartBtn.on("click", handleAddToCart)

  deleteCartItemBtn.on("click", handleCartItemDelete)

  incQtyBtn.on("click", handleCartItemQty)
  decQtyBtn.on("click", handleCartItemQty)


  // * update cart quantity
  function handleCartItemQty() {
    const name = $(this).attr(`name`).trim()
    const input = $(this).parent().find('input')
    const productId = input.attr('data-productId')
    const currentQuantity = parseFloat(input.val().trim())

    let quantity = 0
    switch (name) {
      case 'incQtyBtn':
        quantity = currentQuantity + 1
        break
      case 'decQtyBtn':
        quantity = currentQuantity - 1
        break
      default:
        console.log('invalid value')
    }
    if (quantity > 10) {
      quantity = 10
      return
    }
    if (quantity === 0) {
      handleCartItemDelete(null, productId)
      return
    }

    const cardBody = $(this).parent().parent().parent()
    const price = cardBody.find('#price')

    const totalItems = priceDetails.find("#totalItems")
    const subTotal = priceDetails.find("#subTotal")
    const total = priceDetails.find("#total")
    const deliveryFee = priceDetails.find("#deliveryFee")
    const deliveryFeeValue = parseInt(deliveryFee.text().trim())

    $.ajax({
      url: '/cart/updateqty',
      method: 'PATCH',
      data: { productId, quantity },
      success: function (data) {
        if (data?.cart) {
          input.val(quantity)
          let totalItemsValue = 0
          let subTotalValue = 0
          console.log(data.cart)
          for (const product of data.cart.products) {
            if (product.productId === productId) {
              price.text(`₹${product.price}`)
            }
            totalItemsValue += 1
            subTotalValue += product.price
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

    console.log(name)
    console.log(quantity)
  }

  function handleCartItemDelete(e, productId = null) {
    if (!productId) {
      productId = $(this).attr('data-productId')
    }
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

  // * add to cart btn 
  function handleAddToCart(event) {
    const productId = $(this).attr("data-id")
    console.log("productId ", productId)
    console.log(event)
    $.ajax({
      url: '/cart/',
      method: 'PATCH',
      data: { productId },
      success: function (data) {
        if (!data.product) {
          window.location.href ='/auth/login'
          return
        }
        showAlert(`${data.product.name} added to cart`)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })

  }

  function handleAddToWishlist(e) {
    const productId = $(this).attr('data-id').trim()
    const wishlistIcon = $(this).find('i')
    const card = $(`#${productId}`)

    console.log("productId ", productId)
    $.ajax({
      url: '/profile/wishlist',
      method: 'POST',
      data: { productId },
      success: function (data) {
        if (!data.wishlist) {
          console.log('addToWishlist no data')
          window.location.href='/auth/login'
          return
        }
        // console.log(data)
        if (window.location.pathname === '/profile/wishlist') {
          card.remove()
        } else {
          data.isAdd
            ? wishlistIcon
              .removeClass('text-secondary')
              .addClass('wishlistBtnIcon')
            : wishlistIcon
              .removeClass('wishlistBtnIcon')
              .addClass('text-secondary')
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