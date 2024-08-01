
$(function () {
  const form = $("#formAuthentication")
  const email = $("#email")
  const password = $("#password")
  const submitBtn = $("#signupBtn")
  const name = $("#name")
  const confirmPassword = $("#confirmPassword")
  const referralCode = $('#referralCode')

  const otp = $("#otp")
  const resendOtp = $("#resendOtp")
  const timerSpan = $("#timer")

  const serverErrorMessage = $("#serverErrorMessage")

  // * controlling on signup and otp verify pages
  if (isVerifyOtp) {
    startTimer()
    otp.on("input", checkOtp)
    if (isPasswordChange) {
      form.on("submit", handlePasswordOtpVerification)
    } else {
      form.on("submit", handleOtpVerification)
      resendOtp.on("click", handleResendOtp)
    }
  } else {
    name.on("input", checkName)
    email.on("input", checkEmail)
    password.on("input", checkPassword)
    confirmPassword.on("input", checkConfirmPassword)
    form.on("submit", handleSignup)
  }


  // * password otp verification
  function handlePasswordOtpVerification(e) {
    e.preventDefault()
    console.log("otp")

    if (!checkOtp()) {
      showAlert("invalid otp")
      return
    }
    const otpData = JSON.parse(localStorage.getItem('passwordOtpData'))
    const data = {
      _id: otpData._id,
      username: otpData?.username,
      otp: otp.val().trim()
    }

    $.ajax({
      url: '/auth/password/validate',
      method: 'POST',
      data:data,
      success: function (data) {
        if (!data) {
          console.log('data not found')
        }
        console.log(data)
        window.location.href = '/auth/password/change'
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        setErrorFor(otp, "invalid otp ")
        console.log(res.message)
        console.log(error)
      }
    })

  }

  // * timer function
  function startTimer() {
    if (!resendOtp.hasClass("disabled")) {
      resendOtp.addClass("disabled")
    }
    let timeLeft = 1 * 60
    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    function updateTimer() {
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60
      timerSpan.text(`${minutes.toString().padStart(2, 0)} : ${seconds.toString().padStart(2, 0)}`)
      if (timeLeft > 0) {
        timeLeft--
      } else {
        resendOtp.removeClass("disabled")
        clearInterval(timerInterval)
      }
    }
  }


  // * handle otp resend
  function handleResendOtp() {
    startTimer()
    const otpData = JSON.parse(localStorage.getItem('otpVerificationData'))
    const data = {
      _id: otpData._id,
      email: otpData.username,
    }

    $.ajax({
      url: "/auth/resendotp",
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (resData) {
        console.log(resData)
        if (resData?.data) {
          localStorage.removeItem("otpVerificationData")
          localStorage.setItem("otpVerificationData", JSON.stringify(resData.data))
          showAlert('otp send to email')
        } else {
          window.location.href = "/auth/signup"
        }
      },
      error: function (xhr, status, error) {
        if (xhr.status === 400) {
          window.location.href = '/auth/signup'
        }
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }


  // * handling otp verification
  function handleOtpVerification(e) {
    e.preventDefault()
    console.log("otp")

    let data
    if (!checkOtp()) {
      showAlert("invalid otp")
      return
    }
    const otpData = JSON.parse(localStorage.getItem('otpVerificationData'))
    data = {
      _id: otpData._id,
      username: otpData?.username,
      otp: otp.val().trim()
    }


    $.ajax({
      url: "/auth/verifyemail",
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (resData) {
        console.log(resData)
        if (resData?.user) {
          const { wallet, ...user } = resData.user
          console.log(wallet)
          console.log(user)
          otp.val("")
          localStorage.setItem('user', JSON.stringify(user))
          localStorage.setItem('wallet', JSON.stringify(wallet))
          window.history.replaceState(null, null, '/')
          window.location.replace('/')
        } else {
          setErrorFor(otp, "invalid otp")
          // console.error("no user found")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        setErrorFor(otp, "invalid otp ")
        console.log(res.message)
        console.log(error)
      }
    })
  }


  // * signup handling
  function handleSignup(e) {
    e.preventDefault()
    if (!checkEmail() || !checkPassword() || !checkName() || !checkConfirmPassword()) {
      return
    }
    const data = {
      name: name.val().trim(),
      username: email.val().trim(),
      password: password.val(),
      referralCode: referralCode.val().trim()
    }

    $.ajax({
      url: '/auth/signup',
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (resData) {
        console.log(resData.data.username)
        if (resData?.data?.username) {
          localStorage.setItem('otpVerificationData', JSON.stringify(resData.data))
          name.val("")
          email.val("")
          password.val("")
          confirmPassword.val("")
          window.location.href = '/auth/verifyemail'
        } else {
          setErrorFromServer("no user returned from server")
          // alert("no user returned  from server")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        // alert(res.message)
        setErrorFromServer(res.message)
        console.log(error)
      }
    })
  }


  // * otp check
  function checkOtp() {
    const otpValue = otp.val().trim()
    if (otpValue === '') {
      setErrorFor(otp, "cannot be empty")
      return false
    } else if (!isValidOtp(otpValue)) {
      setErrorFor(otp, "must be 4 digits")
      return false
    } else {
      setSuccessFor(otp)
      return true
    }
  }

  // * check inputs functions
  function checkName() {
    const nameValue = name.val().trim()
    if (nameValue === '') {
      setErrorFor(name, "cannot be empty")
      return false
    } else if (!isValidName(nameValue)) {
      setErrorFor(name, "invalid name")
      return false
    } else {
      setSuccessFor(name)
      return true
    }
  }

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

  function isValidOtp(otp) {
    const otpRegex = /^\d{4}$/
    return otpRegex.test(otp)
  }

  function isConfirmPasswordValid(confirmPasswordValue) {
    return confirmPasswordValue === password.val()
  }


})