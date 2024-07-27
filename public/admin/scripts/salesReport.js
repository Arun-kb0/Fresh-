$(function () {
  // * pagination btns
  const prevBtn = $("#prevBtn")
  const nextBtn = $("#nextBtn")


  const orderStatus = $(".orderStatus")
  const paymentStatus = $('.paymentStatus')
  const createdAt = $(".createdAt")


  const startDate = $("#startDate")
  const endDate = $("#endDate")
  const getByDateRangeBtn = $("#getByDateRangeBtn")
  const dayDropdown = $("#dayDropdown")
  const monthDropdown = $("#monthDropdown")
  const yearDropdown = $("#yearDropdown")
  const excelDownloadBtn = $("#excelDownloadBtn")
  const pdfDownloadBtn = $("#pdfDownloadBtn")

  addDayDropdownValues()
  addYearDropdownValues()
  addMonthDropdownValues()

  nextBtn.on("click", handleNext)
  prevBtn.on("click", handlePrev)

  getByDateRangeBtn.on("click", handleGetByDateRange)
  excelDownloadBtn.on('click', handleExcelDownload)
  pdfDownloadBtn.on('click', handlePdfDownload)


  dayDropdown.find('.dropdown-item').on('click', function () {
    const day = $(this).text().trim()
    console.log('handle day', day)
    const url = `/admin/report/sales?day=${day}`
    window.location.href = url
  })
  monthDropdown.find('.dropdown-item').on('click', function () {
    const month = $(this).attr('data-value')
    console.log('handle month', month)
    const url = `/admin/report/sales?month=${month}`
    window.location.href = url
  })
  yearDropdown.find('.dropdown-item').on('click', function () {
    const year = $(this).text().trim()
    console.log('handle year', year)
    const url = `/admin/report/sales?year=${year}`
    window.location.href = url
  })



  function handleGetByDateRange() {

    let params
    const startDateValue = new Date(startDate.val())
    const endDateValue = new Date(endDate.val())
    const currentDateValue = new Date()
    currentDateValue.setHours(0, 0, 0, 0)

    if (startDateValue > currentDateValue
      || endDateValue < startDateValue
    ) {
      showAlert('invalid date values')
      return
    }

    params = `?startDate=${startDateValue}&endDate=${endDateValue}`
    const url = '/admin/report/sales'
    window.location.href = url + params
  }

  function handleExcelDownload() {
    const params = window.location.search
    const url = params
     ?  `/admin/report/sales${params}&isExcelDownload=true`
     : `/admin/report/sales?isExcelDownload=true`
    window.location.href = url
  }

  function handlePdfDownload() {
    const params = window.location.search
    const url = params
      ? `/admin/report/sales${params}&isPdfDownload=true`
      : `/admin/report/sales?isPdfDownload=true`
    window.location.href = url
  }


  function addYearDropdownValues() {
    const currentYear = new Date().getFullYear()
    const startYear = 2000
    const endYear = currentYear

    const yearDropdown = $("#yearDropdown")
    for (let year = startYear; year <= endYear; year++) {
      const htmlLi = $(`<li class="dropdown-item"></li>`).text(year)
      yearDropdown.append(htmlLi)
    }
  }

  function addMonthDropdownValues() {
    const monthDropdown = $("#monthDropdown")
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentMonth = new Date().getMonth();
    const filteredMonths = months.slice(0, currentMonth+1);
    filteredMonths.forEach((month, index) => {
      const htmlLi = $(`<li class="dropdown-item"></li>`)
        .text(month)
        .attr('data-value', index + 1)
      monthDropdown.append(htmlLi)
    })
  }

  function addDayDropdownValues() {
    const dayDropdown = $("#dayDropdown")

    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    for (let day = 1; day <= currentDay; day++) {
      const htmlLi = $(`<li class="dropdown-item"></li>`).text(day)
      dayDropdown.append(htmlLi)
    }
  }


  // * style order and payment states, hide cancel and return btn
  orderStatus.each(function () {
    const element = $(this).parent()
    changeOrderStatusStyle(element)
  })

  paymentStatus.each(function () {
    const element = $(this).parent()
    changePaymentStatusStyle(element)
  })
  // * style order and payment states end

  // * status styling functions
  function changePaymentStatusStyle(element) {
    const elementValue = element.text().trim()
    switch (elementValue) {
      case 'Pending':
        element
          .removeClass()
          .addClass("btn btn-sm text-white paymentStatus bg-warning")
        break;
      case 'Completed':
        element
          .removeClass()
          .addClass("btn btn-sm text-white paymentStatus bg-success")
        break;
      case 'Failed':
        element
          .removeClass()
          .addClass("btn btn-sm text-white paymentStatus bg-danger")
        break;
      case 'Refunded':
        element
          .removeClass()
          .addClass("btn btn-sm text-white paymentStatus bg-info")
        break;
      default:
        console.log("invalid payment status value")
    }
  }

  function changeOrderStatusStyle(element) {
    const elementValue = element.text().trim()
    switch (elementValue) {
      case 'Pending':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-warning")
        break;
      case 'Processing':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-warning")
        break;
      case 'Shipped':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-info")
        break;
      case 'Delivered':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-success")
        break;
      case 'Cancelled':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-danger")
        break;
      case 'Return Requested':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-warning")
        break;
      case 'Return Approved':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-warning")
        break;
      case 'Returned':
        element
          .removeClass()
          .addClass("btn btn-sm text-white orderStatus bg-primary")
        break;


      default:
        console.log("invalid order status value")
    }
  }
  // * status styling functions end


  // * createdAt to readable date string
  createdAt.each(function () {
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
    console.log(page)
    if (numberOfPages > page) {
      page++
      console.log(page)
      window.location.href = params
        ? `/admin/report/sales${params}&page=${page}`
        : `/admin/report/sales?&page=${page}`
    }
  }

  function handlePrev() {
    console.log(page)
    if (1 < page) {
      page--
      window.location.href = params
        ? `/admin/report/sales${params}&page=${page}`
        : `/admin/report/sales?&page=${page}`
    }
  }
  // * pagination end


  // * date picker init
  $("#datepicker").datepicker({
    autoclose: true,
    todayHighlight: true,
  }).datepicker('update', new Date());

  $("#datepicker2").datepicker({
    autoclose: true,
    todayHighlight: true,
  }).datepicker('update', new Date());

})