
$(function () {
  const date = $(".date")
  const amountInput = $("#amountInput")

  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")

  prevBtn.on('click', handlePrev)
  nextBtn.on('click', handleNext)


  // * createdAt to readable date string
  date.each(function () {
    const element = $(this)
    const elementValue = element.text().trim()
    const date = new Date(elementValue)
    const day = date.toDateString().split(' ')[0];
    const month = date.toDateString().split(' ')[1];
    const dateOfMonth = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    const formattedDate = `${day} ${month} ${dateOfMonth} ${year} ${hour}hr:${minute}min`;
    element.text(formattedDate)
  })



  // * pagination
  let { page, numberOfPages } = pageDetails
  if (numberOfPages === page) {
    nextBtn.prop("disabled", true)
  }
  if (1 === page) {
    prevBtn.prop("disabled", true)
  }

  function handleNext() {
    if (numberOfPages > page) {
      page++
      console.log(page)
      window.location.href = `/profile/wallet?page=${page}`
    }
  }

  function handlePrev() {
    if (1 < page) {
      page--
      console.log(page)
      window.location.href = `/profile/wallet?page=${page}`
    }
  }
  // * pagination end

  // * paypal code
  window.paypal
    .Buttons({
      style: {
        shape: "rect",
        layout: "vertical",
        color: "gold",
        label: "paypal",
      },
      message: {
        amount: 100,
      },
      async createOrder(data, actions) {
        try {
          const amount = amountInput.val().trim()
          const amountInUSD = await convertIndToUsd({ amount })
          if (!amountInUSD) {
            throw new Error('invalid amount')
          }
          return actions.order.create({
            purchase_units: [
              { amount: { value: amountInUSD, } }
            ]
          })

        } catch (error) {
          showAlert(error.message)
          console.log("payment error catched on createOrder ")
          console.error(error);
        }
      },
      async onApprove(data, actions) {
        try {
          console.log(data)
          const orderData = await actions.order.capture()
          const errorDetail = orderData?.details?.[0];
          if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
            return actions.restart();
          } else if (errorDetail) {
            throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
          } else if (!orderData.purchase_units) {
            throw new Error(JSON.stringify(orderData));
          } else {
            const transaction =
              orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
              orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
            console.log(transaction)
            console.log(
              "Capture result",
              orderData,
              JSON.stringify(orderData, null, 2)
            );
            const amount = amountInput.val().trim()
            handleAmountWalletSuccess({amount})
            if (!transaction || transaction?.status !== "COMPLETED") {
              throw new Error(`payment capture ${transaction?.status}`)
            }
          }
        } catch (error) {
          showAlert('transaction failed')
          console.log("payment error catched on onApprove ")
          console.error(error);
        }
      },
    })
    .render("#paypal-button-container");



  // * currency converter api call
  async function convertIndToUsd({ amount }) {
    try {
      const res = await fetch('https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_ErHodFYZKc4VNoqTdvXoiOMdiO4ySsezxiHEk11h&currencies=USD&base_currency=INR')
      if (!res.ok) {
        throw new Error('exchange rate fetch failed')
      }
      const data = await res.json()
      const exchangeRate = data.data.USD
      const totalExRate = (parseFloat(amount) * exchangeRate).toFixed(2)
      console.log('convertIndToUsd totalExchangeRate ', totalExRate)
      return totalExRate
    } catch (error) {
      showAlert(error.message)
      console.log(error)
    }
  }

  async function handleAmountWalletSuccess({ amount }) {
    $.ajax({
      url: '/profile/wallet/',
      method: 'POST',
      data: {amount},
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

})