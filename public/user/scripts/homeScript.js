$(function () {

  const addToCartBtn = $(".addToCartBtn")

  console.log(addToCartBtn)

  addToCartBtn.on("click", handleAddToCart)


  function handleAddToCart() {
    const productId = $(this).attr("data-id")
    const productPrice = parseFloat($(this).attr("data-price"))

    if (localStorage.getItem('cart')) {
      const cart = JSON.parse(localStorage.getItem('cart'))
      cart[productId] = {
        productId,
        quantity: cart[productId]?.quantity ? cart[productId].quantity+ 1 : 1,
        price:  cart[productId]?.price ? parseFloat(cart[productId].price) + productPrice : productPrice,
      }
      localStorage.setItem('cart', JSON.stringify(cart))
    } else {
      const newCart = {}
      newCart[productId] = {
        productId,
        quantity: 1,
        price: productPrice,
      }
      localStorage.setItem('cart',JSON.stringify(newCart))
    }

  }

})