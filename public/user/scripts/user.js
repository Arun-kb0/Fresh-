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

    //*  second btn hide
    $logoutBtn.hide();
    $logoutBtn2.show();

    // getWishlistProductIds()
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

  // function getWishlistProductIds() {
  //   $.ajax({
  //     url: '/profile/wishlist/productIds',
  //     method: 'GET',
  //     success: function (data) {
  //       if (!data) {
  //         console.log('wishlist data not found')
  //         return
  //       }
  //       console.log(data)
  //       const wishlistProductIds = JSON.stringify(data.wishlist?.productIds)
  //       window.localStorage.setItem('wishlist', wishlistProductIds)
  //       updateWishlistBtns()
  //     },
  //     error: function (xhr, status, error) {
  //       console.log(error)
  //     }
  //   })
  // }

  // function updateWishlistBtns() {
  //   const items = window.localStorage.getItem('wishlist');
  //   let wishlistProductIds = JSON.parse(items) || [];

  //   $('.scrollContainer').find('.cardStoke').each(function () {
  //     const productId = $(this).attr('data-id');
  //     const wishlistBtn = $(this).find('.addToWishlistBtn');
  //     console.log(productId)
  //     console.log('wishlistBtn wishlistBtn')
  //     if (wishlistProductIds.includes(productId)) {
  //       wishlistBtn.css('color', 'red'); // Change to red if in wishlist
  //     } else {
  //       wishlistBtn.css('color', 'black'); // Change to black if not in wishlist
  //     }
  //   });
  // }

  // function observeCardInsertions() {
  //   const targetNode = document.querySelector('.scrollContainer');
  //   const config = { childList: true, subtree: true };

  //   const callback = function (mutationsList, observer) {
  //     for (let mutation of mutationsList) {
  //       if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
  //         updateWishlistBtns();
  //       }
  //     }
  //   };

  //   const observer = new MutationObserver(callback);
  //   observer.observe(targetNode, config);
  // }

})