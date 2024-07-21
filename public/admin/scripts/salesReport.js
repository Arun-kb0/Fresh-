$(function () {

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

  getByDateRangeBtn.on("click", handleGetByDateRange)
  excelDownloadBtn.on('click',handleExcelDownload)
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
    const url = `/admin/report/sales${params}&isExcelDownload=true` 
    window.location.href = url
  }

  function handlePdfDownload() { 
    const params = window.location.search
    const url = `/admin/report/sales${params}&isPdfDownload=true`
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
    months.forEach((month, index) => {
      const htmlLi = $(`<li class="dropdown-item"></li>`)
        .text(month)
        .attr('data-value',index+1)
      monthDropdown.append(htmlLi)
    })
  }

  function addDayDropdownValues() {
    const dayDropdown = $("#dayDropdown")
    for (let day = 1; day < 20; day++){
      const htmlLi = $(`<li class="dropdown-item"></li>`).text(day)
      dayDropdown.append(htmlLi)
    }
  }


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