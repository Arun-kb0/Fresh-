$(function () {

  const blockBtn = $(".blockBtn")
  const bsAlert = $("#bsAlert")


  blockBtn.on("click", handleBlockUser)

  // * block user
  function handleBlockUser() {
    const userId = this.getAttribute("data-item")
    const button = $(this)
    console.log(userId)
    $.ajax({
      url: `/admin/user/block?userId=${userId}`,
      method: "PATCH",
      success: function (data) {
        if (data.user?.isBlocked) {
          button
            .removeClass("btn-outline-danger")
            .addClass("btn-outline-success")
            .text("unblock")

        } else {
          button
            .removeClass("btn-outline-success")
            .addClass("btn-outline-danger")
            .text("block")
        }
        showAlert(data.message)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }


  function showAlert(message) {
    bsAlert
      .removeClass('d-none')
      .text(message)

    setTimeout(() => {
      bsAlert.addClass('d-none')
    }, 10000 * 1)
  }

})