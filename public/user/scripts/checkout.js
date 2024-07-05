$(function () {
  
  const addressRadioBtn = $("#addressRadioBtn") 
  const paymentRadioBtn = $("#paymentRadioBtn") 
  

  const selectPaymentBtn = $("#selectPaymentBtn")
  const selectAddressBtn = $("#selectAddressBtn")
  const paymentBtn = $(".paymentBtn")

  paymentBtn.on("click" , handlePayment)

  let addressId=''
  let paymentMethod=''
  selectPaymentBtn.on("click", function () {
    paymentMethod = $('input[name="paymentRadioBtn"]:checked').next('label').attr('name');
    console.log(paymentMethod)
  })

  selectAddressBtn.on("click", function () {
    addressId = $('input[name="addressRadioBtn"]:checked').attr('data-addressId');
    console.log(addressId)
  })


  function handlePayment() {
    if (!addressId || !paymentMethod) {
      showAlert("select address and payment method")
      return
    }
    
    $.ajax({
      url: '/cart/placeordercod',
      method: 'POST',
      data: { addressId },
      success: function (data) {
        if (data.order) {
          console.log(data.order)
          
        } else {
          console.log('no order found')
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