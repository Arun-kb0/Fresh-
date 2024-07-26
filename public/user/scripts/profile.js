$(function () {
  const copyReferralCodeBtn = $("#copyReferralCodeBtn")

  copyReferralCodeBtn.on("click", handleCopyCode)


  function handleCopyCode() {
    const code = $(this).attr('data-code')
    console.log(code)

    navigator.clipboard.writeText(code)
      .then(() => {
        showAlert('referral code copied')
      })
      .catch((error) => {
        showAlert('referral code not copied')
        console.log(error)
      })

  }

})