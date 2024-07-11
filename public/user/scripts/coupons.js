$(function () {
  
  const coupon = $(".couponContainer")

  coupon.on("click", handleCopy)
  
  function handleCopy() {
    const code = $(this).attr('data-code')
    
    navigator.clipboard.writeText(code)
      .then(() => {
        showAlert(`Coupon code ${code} copied`)
      })
      .catch((error) => {
        console.error('Failed to copy coupon code')
        console.log(error)

      })
  }

})