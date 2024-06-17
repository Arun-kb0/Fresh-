$(function () {
  const logoutBtn = $("#logoutBtn")

  logoutBtn.on("click", function () {
    $.ajax({
      url: "/auth/logout",
      type: "GET",
      success: function (data) {
        console.log(data)
        if (data) {
          localStorage.clear()
          window.location.reload()
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(error)
      }
    })
  })
})