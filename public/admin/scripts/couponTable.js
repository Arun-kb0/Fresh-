$(function () {
  const startDateTd = $(".startDateTd");
  const endDateTd = $(".endDateTd");

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