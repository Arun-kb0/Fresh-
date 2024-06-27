
$(function () {

  const form = $("#formAuthentication")
  const email = $("#email")
  const password = $("#password")
  const submitBtn = $("#submitBtn")
  const serverErrorMessage = $("#serverErrorMessage")


  email.on("input", checkEmail)
  password.on("input", checkPassword)
  form.on("submit", handleLogin)

  console.log("isAdmin", isAdmin)

  function handleLogin(e) {
    e.preventDefault()
    if (!checkEmail() || !checkPassword()) {
      alert("invalid email or password")
      return
    }
    const data = {
      username: email.val().trim(),
      password: password.val().trim()
    }

    const url = isAdmin
      ? "/auth/admin/login"
      : "/auth/login"

    $.ajax({
      url: url,
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (data) {
        console.log(data)
        console.log('login success')
        if (data?.user) {
          console.log(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
          email.val("")
          password.val("")
          if (data?.user?.isAdmin) {
            window.history.replaceState(null, null, '/admin/')
            window.location.replace('/admin/')
          } else {
            window.history.replaceState(null, null, '/')
            window.location.replace('/')
          }
        } else {
          setErrorFromServer("invalid username or password")
          console.log("no user returned  from server")
        }

      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        setErrorFromServer(res.message)
        // alert(res.message)
        console.log(error)
      }
    })
  }


  // * check inputs functions
  function checkEmail() {
    clearServerError()
    const emailValue = email.val().trim()
    if (emailValue === "") {
      setErrorFor(email, "cannot be empty")
      return false
    } else if (!isEmail(emailValue)) {
      setErrorFor(email, "invalid email")
      return false
    } else {
      setSuccessFor(email)
      return true
    }
  }

  function checkPassword() {
    clearServerError()
    const passwordValue = password.val().trim()
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

  // * validation error function
  function setErrorFor(input, msg) {
    let parent
    if (input.attr("name") === "password") {
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
    if (input.attr("name") === "password") {
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

  // * validation regex helpers
  function isEmail(email) {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailRegex.test(email)
  }

  function isPassword(password) {
    const passwordRegex = /^.{8,}$/
    return passwordRegex.test(password)
  }

})