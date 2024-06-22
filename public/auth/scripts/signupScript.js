
$(function () {
  const form = $("#formAuthentication")
  const email = $("#email")
  const password = $("#password")
  const submitBtn = $("#signupBtn")
  const name = $("#name")
  const confirmPassword = $("#confirmPassword")
  

  const otp = $("#otp")
  const resendOtp = $("#resendOtp")
  const timerSpan = $("#timer")


  // * controlling on signup and otp verify pages
  if (isVerifyOtp) {
    startTimer()
    otp.on("input", checkOtp)
    form.on("submit", handleOtpVerification)
    resendOtp.on("click", handleResendOtp)

  } else {
    name.on("input", checkName)
    email.on("input", checkEmail)
    password.on("input", checkPassword)
    confirmPassword.on("input", checkConfirmPassword)
    form.on("submit", handleSignup)
  }

  // * timer function
  function startTimer() {
    let timeLeft = 5 * 60
    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    function updateTimer() {
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60
      timerSpan.text(`${minutes.toString().padStart(2, 0)} : ${seconds.toString().padStart(2, 0)}`)
      if (timeLeft > 0) {
        timeLeft--
      } else {
        clearInterval(timerInterval)
      }
    }
  }


  // * handle otp resend
  function handleResendOtp() {
    const otpData = JSON.parse(localStorage.getItem('otpVerificationData'))
    const data = {
      userId: otpData.userId,
      email: otpData.email
    }

    $.ajax({
      url: "/auth/resendotp",
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (resData) {
        console.log(resData)
        if (resData) {
          alert('otp send to email')
        }
        // window.location.href = "/"
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(ErrorEvent)
      }
    })
  }


  // * handling otp verification
  function handleOtpVerification(e) {
    e.preventDefault()
    console.log("otp")

    if (!checkOtp()) {
      alert("invalid otp")
      return
    }
    const otpData = JSON.parse(localStorage.getItem('otpVerificationData'))
    const data = {
      userId: otpData.userId,
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
          localStorage.setItem('user', JSON.stringify(user))
          localStorage.setItem('wallet', JSON.stringify(wallet))
          otp.val("")
          window.location.href = "/"
        } else {
          console.error("no user found")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(ErrorEvent)
      }
    })
  }


  // * signup handling
  function handleSignup(e) {
    e.preventDefault()
    if (!checkEmail() || !checkPassword() || !checkName() || !checkConfirmPassword()) {
      console.log("invalid email or password")
      return
    }
    const data = {
      name: name.val().trim(),
      username: email.val().trim(),
      password: password.val()
    }

    $.ajax({
      url: '/auth/signup',
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (resData) {
        console.log(resData)
        if (resData?.data?.userId) {
          localStorage.setItem('otpVerificationData', JSON.stringify(resData.data))
          name.val("")
          email.val("")
          password.val("")
          window.location.href = '/auth/verifyemail'
        } else {
          alert("no user returned  from server")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        alert(res.message)
        console.log(error)
      }
    })
  }


  // * otp check
  function checkOtp() {
    const otpValue = otp.val().trim()
    console.log(otpValue)
    if (otpValue === '') {
      setErrorFor(otp, "cannot be empty")
      return false
    } else if (!isValidOtp(otpValue)) {
      setErrorFor(otp, "invalid otp")
      return false
    } else {
      setSuccessFor(otp)
      return true
    }
  }

  // * check inputs functions
  function checkName() {
    const nameValue = name.val().trim()
    console.log(nameValue)
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
    console.log(confirmPasswordValue)
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
    if (input.attr("name") === "password" || input.attr("name") === "confirmPassword" ) {
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