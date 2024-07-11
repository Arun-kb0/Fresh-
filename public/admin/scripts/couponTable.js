$(function () {
  const startDateTd = $(".startDateTd");
  const endDateTd = $(".endDateTd");
  const deleteBtn = $(".deleteCouponBtn")

  deleteBtn.on("click",handleDelete)

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

  function handleDelete() {
    const code = $(this).attr('data-item')

    $.ajax({
      url: '/admin/coupon',
      method: "DELETE",
      data: { code },
      success: function (data) {
        if (data) {
          showAlert(data.message)
        } else {
          console.log("invalid res data")
        }
      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }





})