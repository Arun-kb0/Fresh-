$(function () {

  const $container = $('.scrollContainer');
  const scrollAmount = 300; 

  // * handle scroll
  $('#scroll-left').on('click', function () {
    $container.animate({
      scrollLeft: '-=' + scrollAmount
    }, 500);
  });

  $('#scroll-right').on('click', function () {
    $container.animate({
      scrollLeft: '+=' + scrollAmount
    }, 500);
  });



  // * storing user data
  const urlParams = new URLSearchParams(window.location.search)
  console.log(urlParams)
  let user
  if (urlParams.size > 1) {
    user = {
      _id: urlParams.get('_id'),
      userId: urlParams.get('userId'),
      name: urlParams.get('name'),
      username: urlParams.get('username'),
      isAdmin: urlParams.get('isAdmin'),
      provider: urlParams.get('provider')
    }
    console.log(user)
    localStorage.setItem('user', JSON.stringify(user))
  }

})