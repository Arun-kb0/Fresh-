$(function () {


  // * storing user data
  const urlParams = new URLSearchParams(window.location.search)
  console.log(urlParams)
  let sessionUser
  if (urlParams.size > 1 && urlParams.get('userId')) {
    sessionUser = {
      _id: urlParams.get('_id'),
      userId: urlParams.get('userId'),
      name: urlParams.get('name'),
      username: urlParams.get('username'),
      isAdmin: urlParams.get('isAdmin'),
      provider: urlParams.get('provider')
    }
    console.log(sessionUser)
    localStorage.setItem('user', JSON.stringify(sessionUser))
  }


  const $navUserDropdownToggle = $("#navUserDropdownToggle");
  const $loginSection = $("#loginSection");
  const $userSection = $("#userSection");
  const $userImage = $("#userImage");
  const $logoutBtn = $("#logoutBtn");
  const $logoutBtn2 = $("#logoutBtn2");

  const user = JSON.parse(localStorage.getItem("user"))
  console.log(user)
  if (user) {
    $loginSection.hide();
    $userSection.show();

    $userImage.html('<p>' + user.name + "</p>");

    $logoutBtn.hide(); // Example: If you have two logout buttons, you might want to hide one
    $logoutBtn2.show();
  } else {
    $loginSection.show();
    $userSection.hide();
  }

  // $logoutBtn.on("click", function () {
  //   localStorage.removeItem("user");
  //   window.location.href = "/"; 
  // });

  // $logoutBtn2.on("click", function () {
  //   localStorage.removeItem("user");
  //   window.location.href = "/"; // Redirect to home page or login page after logout
  // });



})