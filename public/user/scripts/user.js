$(function () {

  const cookieUser = getCookie('user');
  if (cookieUser) {
    try {
      const decodedCookieUser = decodeURIComponent(cookieUser);
      const userData = JSON.parse(decodedCookieUser);
      console.log("User cookie:", userData);
      localStorage.setItem('user', JSON.stringify(userData))

    } catch (error) {
      console.error("Error parsing cookie:", error);
    }
  } else {
    console.log("No user cookie found");
  }


  const $navUserDropdownToggle = $("#navUserDropdownToggle");
  const $loginSection = $("#loginSection");
  const $userSection = $("#userSection");
  const $userName = $("#userName");
  const $logoutBtn = $("#logoutBtn");
  const $logoutBtn2 = $("#logoutBtn2");

  const user = JSON.parse(localStorage.getItem("user"))
  // console.log(user)
  if (user) {
    $loginSection.hide();
    $userSection.show();

    $userName.html(`<span>${user.name}<span/>`);

    $logoutBtn.hide(); // Example: If you have two logout buttons, you might want to hide one
    $logoutBtn2.show();
  } else {
    $loginSection.show();
    $userSection.hide();
  }


  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    } else {
      console.error("Cookie not found");
      return null;
    }
  }

})