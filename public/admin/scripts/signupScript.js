
$(function () {

  const form = $("#formAuthentication")
  const email = $("#email")
  const password = $("#password")
  const submitBtn = $("#signupBtn")
  const name = $("#name")

  name.on("input", checkName)
  email.on("input", checkEmail)
  password.on("input", checkPassword)

  form.on("submit", function (e) {
    e.preventDefault()

    if (!checkEmail() || !checkPassword() || !checkName()) {
      alert("invalid email or password")
      return
    }

    const data = {
      name: name.val().trim(),
      username: email.val().trim(),
      password: password.val().trim()
    }

    $.ajax({
      url: '/auth/signup',
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (data) {
        console.log(data)
        window.location.href = '/auth/verifyemail'
        
        // if (data.user) {
        //   localStorage.setItem('user', JSON.stringify(data.user))
        //   name.val("")
        //   email.val("")
        //   password.val("")
        // } else {
        //   alert("no user returned  from server")
        // }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(error)
      }
    })
  })

  // * check inputs functions
  function checkName() {
    const nameValue = name.val().trim()
    console.log(nameValue)
    if (nameValue === '') {
      setErrorFor(name, "cannot be empty")
      return false
    } else if (!isValidName(nameValue)) { 
      setErrorFor(name , "invalid name")
      return false
    } else {
      setSuccessFor(name)
      return true
    }
  }

  function checkEmail() {
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

  // * validation regex helpers
  function isEmail(email) {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailRegex.test(email)
  }

  function isPassword(password) {
    const passwordRegex = /^.{8,}$/
    return passwordRegex.test(password)
  }

  function isValidName(name) {
    const nameRegex = /^[a-zA-Z]+(?:\s[a-zA-Z]+(?:\s[a-zA-Z]+)*)?$/
    return nameRegex.test(name)
  }

})