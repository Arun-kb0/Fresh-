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
          if (data.isAdmin) {
            window.history.replaceState(null, null, '/auth/admin/login')
            window.location.replace('/auth/admin/login')
          } else {
            window.history.replaceState(null, null, '/auth/login')
            window.location.replace('/auth/login')
          }
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