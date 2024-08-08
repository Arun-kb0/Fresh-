$(function () {
  const logoutBtn = $("#logoutBtn")
  const logoutBtn2 = $("#logoutBtn2")
  const profileLogoutBtn = $("#profileLogoutBtn")

  logoutBtn.on("click", handleLogout)
  logoutBtn2.on("click", handleLogout)
  profileLogoutBtn.on("click", handleLogout)


  function handleLogout() {
    $.ajax({
      url: "/auth/logout",
      type: "GET",
      success: function (data) {
        console.log(data)
        if (data) {
          console.log(data)
          localStorage.clear()
          if (data.isAdmin) {
            window.history.replaceState(null, null, '/auth/admin/login')
            window.location.replace('/auth/admin/login')
          } else {
            window.location.replace('/')
            // window.history.replaceState(null, null, '/auth/login')
            // window.location.replace('/auth/login')
          }
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