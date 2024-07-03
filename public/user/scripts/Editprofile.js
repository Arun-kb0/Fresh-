$(function () {

  const editUserModalBtn = $("#editUserModalBtn")
  const username = $("#username")
  const name = $("#Name")
  const password = $("#password")
  const confirmPassword = $("#confirmPassword")
  const editUserBtn = $("#editUserBtn")



  username.on("input", checkEmail)
  name.on("input", checkName)
  password.on("input", checkPassword)
  confirmPassword.on("input", checkConfirmPassword)

  editUserModalBtn.on("click", handleModalUser)
  editUserBtn.on("click", handleEditUser)
  let userId = ""

  function handleEditUser() {
    const sessionUser = JSON.stringify(localStorage.getItem('user'))
    const { provider } = sessionUser

    if (provider) {
      if (
        !checkName(name)
        || !checkEmail(username)
        || !checkPassword(password)
        || !checkConfirmPassword(confirmPassword)
      ) {
        showAlert('invalid fields')
        return
      }
    } else {
      if (!checkName(name)) {
        showAlert('invalid fields')
        return
      }
    }
    const user = getFromInputs()
    user.userId = userId
    console.log(user)
    $.ajax({
      url: '/profile/user',
      method: 'PATCH',
      data: user,
      success: function (data) {
        window.location.reload()
      },
      error: function (xhr, status, error) {
        const res = JSON.stringify(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })


  }

  function handleModalUser() {
    userId = $(this).attr('data-item')
    $.ajax({
      url: "/profile/userdetails",
      method: "GET",
      success: function (data) {
        if (data?.user)
          setEditInputs(data.user)
        else
          console.log("no data found")
      },
      error: function (xhr, status, error) {
        console.log(error)
      }
    })
  }

  // * set edit input values
  function setEditInputs(user) {
    console.log(user)
    $('#editForm input').each(function () {
      const input = $(this);
      const inputName = input.attr('name');
      if (inputName !== 'password') {
        input.val(user[inputName])
      }
    });
  }

  // * get create inputs values
  function getFromInputs() {
    formInputs = $("#editForm input")
    const data = {}
    formInputs.each(function () {
      const input = $(this);
      const inputName = input.attr('name');
      if (inputName !== "confirmPassword") {
        data[inputName] = input.val()
      }
    });
    return data
  }

  // * checks


  // * form checks
  function checkEmail(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      const inputValue = input.val().trim()
      if (input === "") {
        setErrorFor(input, "cannot be empty")
        return false
      } else if (!isEmail(inputValue)) {
        setErrorFor(input, `invalid ${input.attr("name")}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }
  }

  function checkName(eventOrElement) {

    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      const inputValue = input.val().trim()
      if (input === "") {
        setErrorFor(input, "cannot be empty")
        return false
      } else if (!isName(inputValue)) {
        setErrorFor(input, `invalid ${input.attr("name")}`)
        return false
      } else {
        setSuccessFor(input)
        return true
      }
    } catch (error) {
      console.log(error)
    }
  }


  function checkConfirmPassword(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    const inputValue = input.val()
    if (inputValue === "" && password.val().length === 0) {
      setSuccessFor(input)
      return true
    } else if (password.val() !== inputValue) {
      setErrorFor(input, "confirm password is not same as password")
      return false
    } else {
      setSuccessFor(input)
      return true
    }

  }

  function checkPassword(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    const inputValue = input.val().trim()
    if (inputValue.length === 0) {
      setSuccessFor(input)
      return true
    } else if (!isPassword(inputValue)) {
      setErrorFor(input, "invalid input")
      return false
    } else {
      setSuccessFor(input)
      return true
    }
  }

  // * validation error function
  function setErrorFor(input, msg) {
    try {
      if (!input) return
      console.log(input.val())
      let parent = input.parent()
      const small = parent.find("#small")
      small.removeClass()
      small.addClass("text-danger opacity-1")
      small.text(msg)
      editUserBtn.prop("disabled", true)

    } catch (error) {
      console.log(error)
    }
  }


  // * validation success function
  function setSuccessFor(input) {
    try {
      if (!input) return
      let parent = input.parent()
      const small = parent.find("#small")
      small.text("")
      small.removeClass()
      small.addClass("opacity-0")
      editUserBtn.prop("disabled", false)
    } catch (error) {
      console.log(error)
    }
  }



  // * regex functions
  function isEmail(email) {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailRegex.test(email)
  }

  function isName(name) {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name)
  }

  function isPassword(password) {
    const passwordRegex = /^.{8,}$/
    return passwordRegex.test(password)
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