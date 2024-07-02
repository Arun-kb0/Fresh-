$(function () {
  // * create modal input fields
  const nameCreate = $("#createModal").find("#Name")
  const flatNoCreate = $("#createModal").find("#flatNo")
  const phoneCreate = $("#createModal").find("#phone")
  const emailCreate = $("#createModal").find("#email")
  const stateCreate = $("#createModal").find("#state")
  const countryCreate = $("#createModal").find("#country")
  const cityCreate = $("#createModal").find("#city")
  const placeCreate = $("#createModal").find("#place")
  const pinCodeCreate = $("#createModal").find("#pinCode")
  // * create modal input fields end

  // * edit modal input fields
  const nameEdit = $("#editModal").find("#Name")
  const flatNoEdit = $("#editModal").find("#flatNo")
  const phoneEdit = $("#editModal").find("#phone")
  const emailEdit = $("#editModal").find("#email")
  const stateEdit = $("#editModal").find("#state")
  const countryEdit = $("#editModal").find("#country")
  const cityEdit = $("#editModal").find("#city")
  const placeEdit = $("#editModal").find("#place")
  const pinCodeEdit = $("#editModal").find("#pinCode")
  // * edit modal input fields end

  const editAddressModelBtn = $(".editAddressModelBtn")
  const deleteAddressBtn = $(".deleteAddressBtn")
  const editAddressBtn = $("#editModal").find("#editAddress")
  const createAddressBtn = $("#createModal").find("#createAddress")


  // * validations create
  flatNoCreate.on("input", checkFlatNo)
  pinCodeCreate.on("input", checkPinCode)
  phoneCreate.on("input", checkPhone)
  emailCreate.on("input", checkEmail)
  nameCreate.on("input", checkNameAndCity)
  cityCreate.on("input", checkNameAndCity)
  placeCreate.on("input", checkNameAndCity)
  stateCreate.on("input", checkLocations)
  countryCreate.on("input", checkLocations)
  // * validations create end


  // * validations edit
  flatNoEdit.on("input", checkFlatNo)
  pinCodeEdit.on("input", checkPinCode)
  phoneEdit.on("input", checkPhone)
  emailEdit.on("input", checkEmail)
  nameEdit.on("input", checkNameAndCity)
  cityEdit.on("input", checkNameAndCity)
  placeEdit.on("input", checkNameAndCity)
  stateEdit.on("input", checkLocations)
  countryEdit.on("input", checkLocations)
  // * validations edit end

  // * db operations
  deleteAddressBtn.on("click", handleDelete)
  editAddressModelBtn.on("click", handleEditModal)
  createAddressBtn.on("click", handleCreateAddress)
  editAddressBtn.on("click", handleEditAddress)
  // * db operations end

  let addressId = ""
  // * db operations functions
  function handleCreateAddress(e) {
    const createFormInputs = $('#createForm input')
    const address = getFromInputs(createFormInputs)
    console.log(address)

    if (
      !checkFlatNo(flatNoCreate) || !checkPinCode(pinCodeCreate)
      || !checkPhone(phoneCreate) || !checkEmail(emailCreate)
      || !checkNameAndCity(nameCreate) || !checkNameAndCity(cityCreate)
      || !checkNameAndCity(placeCreate) || !checkLocations(stateCreate)
      || !checkLocations(countryCreate)
    ) {
      showAlert("invalid data")
      return
    }


    $.ajax({
      url: "/profile/address",
      method: "POST",
      data: address,
      success: function (data) {
        console.log(data)
        window.location.reload()
      },
      error: function (xhr, status, error) {
        const res = JSON.stringify(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }

  function handleEditAddress() {
    console.log("handleEdit ")
    const createFormInputs = $('#editForm input')
    const address = getFromInputs(createFormInputs)
    address.addressId = addressId
    console.log(address)
    if (
      !checkFlatNo(flatNoEdit) || !checkPinCode(pinCodeEdit)
      || !checkPhone(phoneEdit) || !checkEmail(emailEdit)
      || !checkNameAndCity(nameEdit) || !checkNameAndCity(cityEdit)
      || !checkNameAndCity(placeEdit) || !checkLocations(stateEdit)
      || !checkLocations(countryEdit)
    ) {
      showAlert("invalid input ")
      return
    }

    $.ajax({
      url: `/profile/address`,
      method: "PATCH",
      data: address,
      success: function (data) {
        console.log(data)
        window.location.reload()

      },
      error: function (xhr, status, error) {
        const res = JSON.stringify(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }

  // * edit modal
  function handleEditModal(event) {
    addressId = $(this).attr("data-item")
    $.ajax({
      url: `/profile/singleaddress?addressId=${addressId}`,
      method: "GET",
      success: function (data) {
        if (data.address) {
          const { address } = data
          setEditInputs(address)
        } else {
          console.log("no address found")
        }
      },
      error: function (xhr, status, error) {
        console.log(error)
      }
    })
  }

  function handleDelete(event) {
    const addressId = $(this).attr("data-item")
    $.ajax({
      url: `/profile/address?addressId=${addressId}`,
      method: "DELETE",
      success: function (data) {
        if (data) {
          window.location.reload()
        } else {
          console.log("no data found")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        console.log(res.message)
        console.log(error)
      }
    })
  }
  // * db operations functions end


  // * set edit input values
  function setEditInputs(address) {
    $('#editForm input').each(function () {
      const input = $(this);
      const inputName = input.attr('name');
      input.val(address[inputName])
    });
  }
  // * get create inputs values
  function getFromInputs(formInputs) {
    const data = {}
    formInputs.each(function () {
      const input = $(this);
      const inputName = input.attr('name');
      data[inputName] = input.val()
    });
    return data
  }


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

  function checkNameAndCity(eventOrElement) {
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

  function checkFlatNo(eventOrElement) {
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
      } else if (!isFlatNumber(inputValue)) {
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

  function checkPinCode(eventOrElement) {
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
      } else if (!isPinCode(inputValue)) {
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

  function checkLocations(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      console.log(input.val())
      const inputValue = input.val().trim()
      if (inputValue.length === 0) {
        setSuccessFor(input)
        return true
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

  function checkPhone(eventOrElement) {
    let input
    if (eventOrElement.currentTarget) {
      input = $(this);
    } else {
      input = $(eventOrElement)
    }
    try {
      console.log(input.val())
      const inputValue = input.val().trim()
      if (inputValue.length === 0) {
        setSuccessFor(input)
        return true
      } else if (!isPhoneNumber(inputValue)) {
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

  // * form checks end


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
      // submitBtn.prop("disabled", true)
      editAddressBtn.prop("disabled", true)
      createAddressBtn.prop("disabled", true)
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
      editAddressBtn.prop("disabled", false)
      createAddressBtn.prop("disabled", false)
    } catch (error) {
      console.log(error)
    }
  }




  // * regex functions
  function isName(name) {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name)
  }

  function isEmail(email) {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailRegex.test(email)
  }

  function isPhoneNumber(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  }


  function isFlatNumber(flat) {
    const flatNumberRegex = /^[A-Za-z0-9\s\/-]+$/;
    return flatNumberRegex.test(flat);
  }

  function isPinCode(input) {
    const sixDigitRegex = /^\d{6}$/;
    return sixDigitRegex.test(input);
  }


})

