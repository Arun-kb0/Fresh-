$(function () {
  const startDateTd = $(".startDateTd");
  const endDateTd = $(".endDateTd");
  const deleteOfferBtn = $(".deleteOfferBtn")

  deleteOfferBtn.on("click", handleDeleteOffer)


  function handleDeleteOffer() {
    const offerId = $(this).attr('data-item')
    const tableRow = $(`#${offerId}`)
    $.ajax({
      url: '/admin/offer',
      method: 'DELETE',
      data: { offerId },
      success: function (data) {
        if (data) {
          console.log(data)
          tableRow.remove()
          showAlert(data.message)
        } else {
          console.log("delete no data found")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }


  startDateTd.each(function () {
    const dateValue = new Date($(this).text());
    const formattedDate = dateValue.toDateString().slice(0, 10);
    $(this).text(formattedDate);
  });

  endDateTd.each(function () {
    const dateValue = new Date($(this).text());
    const formattedDate = dateValue.toDateString().slice(0, 10);
    $(this).text(formattedDate);
  });

})