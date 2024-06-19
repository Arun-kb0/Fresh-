$(function () {

  const blockBtn = $(".blockBtn")

  blockBtn.on("click", handleBlockUser)

  function handleBlockUser() {
    const userId = this.getAttribute("data-item")
    console.log(userId)
    $.ajax({
      url: `/admin/user/block?userId=${userId}`,
      method: "PATCH",
      success: function (data) {
        if (data.user?.isBlocked) {
          blockBtn
            .removeClass("btn-outline-danger")
            .addClass("btn-outline-success")
            .text("unblock")

        } else {
          blockBtn
            .removeClass("btn-outline-success")
            .addClass("btn-outline-danger")
            .text("block")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(error)
      }
    })
  }
})