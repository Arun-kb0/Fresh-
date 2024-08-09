$(function () {
  const logoutBtn = $("#logoutBtn")
  const logoutBtn2 = $("#logoutBtn2")
  const profileLogoutBtn = $("#profileLogoutBtn")

  logoutBtn.on("click", handleLogout)
  logoutBtn2.on("click", handleLogout)
  profileLogoutBtn.on("click", handleLogout)

  console.log('logout script')
  console.log(window.location.pathname)
  console.log(window.location.pathname.startsWith('/admin'))

  function handleLogout() {
    const url = window.location.pathname.startsWith('/admin')
      ? "/auth/admin/logout"
      : "/auth/logout"
    
    $.ajax({
      url: url,
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