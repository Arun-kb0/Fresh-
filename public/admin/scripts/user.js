$(function () {

  const blockBtn = $(".blockBtn")
  const bsAlert = $("#bsAlert")

  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")

  blockBtn.on("click", handleBlockUser)

  nextBtn.on("click", handleNext)
  prevBtn.on("click", handlePrev)


  // * pagination
  let { page, numberOfPages } = pageDetails
  if (numberOfPages <= page) {
    nextBtn.prop("disabled", true)
  }
  if (1 === page) {
    prevBtn.prop("disabled", true)
  }

  function handleNext() {
    if (numberOfPages > page) {
      page++
      console.log(page)
      window.location.href = `/admin/users?page=${page}`
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      window.location.href = `/admin/users?page=${page}`
    }
  }
  // * pagination end

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