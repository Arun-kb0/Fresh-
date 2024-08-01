$(function () {
  const serverErrorMessage = $("#serverErrorMessage")
  const submitBtn = $("#resetPasswordBtn")
  const confirmPassword = $("#confirmPassword")
  const password = $("#password")
  
  password.on("input", checkPassword)
  confirmPassword.on("input", checkConfirmPassword)
  submitBtn.on('click', handleResetPassword)


  function handleResetPassword(e) {
    e.preventDefault()
    if (!checkPassword() || !checkConfirmPassword()) {
      return
    }
    const data = {
      password: password.val(),
    }

    $.ajax({
      url: '/auth/password/change',
      type: "POST",
      data: data,
      success: function (resData) {
        if (resData) {
          password.val("")
          confirmPassword.val("")
          console.log(resData)
          window.location.href = '/auth/login'
        } else {
          setErrorFromServer("no user returned from server")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        setErrorFromServer(res.message)
        console.log(error)
      }
    })
  }



  function checkPassword() {
    const passwordValue = password.val()
    if (passwordValue === "") {
      setErrorFor(password, "cannot be empty")
      return false
    } else if (!isPassword(passwordValue)) {
      setErrorFor(password, "invalid password")
      return false
    } else {
      setSuccessFor(password)
      return true
    }
  }

  function checkConfirmPassword() {
    const confirmPasswordValue = confirmPassword.val()
    if (confirmPasswordValue === "") {
      setErrorFor(confirmPassword, "cannot be empty")
      return false
    } else if (!isConfirmPasswordValid(confirmPasswordValue)) {
      setErrorFor(confirmPassword, "confirm password is not same as password")
      return false
    } else {
      setSuccessFor(confirmPassword)
      return true
    }

  }



  // * validation error function
  function setErrorFor(input, msg) {
    let parent
    if (input.attr("name") === "password" || input.attr("name") === "confirmPassword") {
      parent = input.parent().parent()
    } else {
      parent = input.parent()
    }
    const small = parent.find("#small")
    small.removeClass()
    small.addClass("text-danger opacity-1")
    small.text(msg)
    submitBtn.prop("disabled", true)
  }

  // * validation success function
  function setSuccessFor(input) {
    let parent
    if (input.attr("name") === "password" || input.attr("name") === "confirmPassword") {
      parent = input.parent().parent()
    } else {
      parent = input.parent()
    }
    const small = parent.find("#small")
    small.text("")
    small.removeClass()
    small.addClass("opacity-0")
    submitBtn.prop("disabled", false)
    console.log(` validation success`)
  }

  // * set server error
  function setErrorFromServer(message) {
    serverErrorMessage.removeClass()
    serverErrorMessage.addClass("text-danger opacity-1")
    serverErrorMessage.text(message)
    submitBtn.prop("disabled", true)
  }

  function clearServerError() {
    serverErrorMessage.removeClass()
    serverErrorMessage.text("")
    submitBtn.prop("disabled", false)
  }

  // * regex 
  function isPassword(password) {
    const passwordRegex = /^.{8,}$/
    return passwordRegex.test(password)
  }


  function isConfirmPasswordValid(confirmPasswordValue) {
    return confirmPasswordValue === password.val()
  }

})