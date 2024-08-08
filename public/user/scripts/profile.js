$(function () {

  const suggestionsContainer = $('.suggestionsContainer')
  const scrollLeft = $("#scroll-left")
  const scrollRight = $("#scroll-right")

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


  // * scroll functions
  suggestionsContainer.on("scroll", function () {
    if ($(this)[0].scrollWidth - $(this).scrollLeft() <= $(this).outerWidth()) {
    }
  });

  scrollLeft.on("click", function () {
    suggestionsContainer.animate({ scrollLeft: '-=300' }, 800);
  });
  scrollRight.on("click", function () {
    suggestionsContainer.animate({ scrollLeft: '+=300' }, 800);
  });
  // * scroll functions end


})