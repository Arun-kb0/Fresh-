$(function () {

  const blockBtn = $(".blockBtn")
  const unblockBtn = $(".unblockBtn")
  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")

  const modelText = $(".modal-header h5")
  const modelYesBtn = $("#yesBtn")
  const modelNoBtn = $("#noBtn")


  // blockBtn.on("click", handleBlockUser)
  // unblockBtn.on("click", handleBlockUser)

  blockBtn.on("click", confirmBlock)
  unblockBtn.on("click", confirmUnblock)
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

  // * confirm block user
  function confirmBlock() {
    const userId = this.getAttribute("data-item")
    const button = $(this)
    modelText.text("confirm block user")
    modelNoBtn.off("click");
    modelYesBtn.off("click");
    modelNoBtn.on("click", function () { })
    modelYesBtn.on("click", function () { handleBlockUser(userId, button) })
  }

  // * confirm unblock user
  function confirmUnblock() {
    const userId = this.getAttribute("data-item")
    const button = $(this)
    modelText.text("confirm unblock user")
    modelNoBtn.off("click");
    modelYesBtn.off("click");
    modelNoBtn.on("click", function () { })
    modelYesBtn.on("click", function () { handleBlockUser(userId, button) })
  }


  // * block and unblock
  function handleBlockUser(userId,button) {
    console.log(button.text())
    console.log(userId)
    $.ajax({
      url: `/admin/user/block?userId=${userId}`,
      method: "PATCH",
      success: function (data) {
        
        // if (data.user?.isBlocked) {
        //   button
        //     .removeClass("btn-outline-danger")
        //     .addClass("btn-outline-success")
        //     .text("unblock")

        // } else {
        //   button
        //     .removeClass("btn-outline-success")
        //     .addClass("btn-outline-danger")
        //     .text("block")
        // }
        showAlert(data.message)
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }


})