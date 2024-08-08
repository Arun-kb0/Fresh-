$(function () {
  var totalRegisters = window.totalRegisters
  var totalProducts = window.totalProducts
  var totalOrders = window.totalOrders
  var ordersPerCategories = window.ordersPerCategories
  // console.log(totalRegisters)
  // console.log(ordersPerCategories)

  const revenueChart = document.getElementById('revenueChart');
  const revenueChartCtx = revenueChart.getContext('2d');
  const orderPaymentTypeChartCtx = document.getElementById('orderPaymentTypes');

  const dayDropdown = $("#dayDropdown")
  const monthDropdown = $("#monthDropdown")
  const yearDropdown = $("#yearDropdown")

  const dayDropdownBtn = $("#dayDropdownBtn")
  const monthDropdownBtn = $("#monthDropdownBtn")
  const yearDropdownBtn = $("#yearDropdownBtn")

  addDayDropdownValues()
  addYearDropdownValues()
  addMonthDropdownValues()


  // * chart functions call
  renderRevenueChart({
    ctx: revenueChartCtx,
    totalRegisters,
    totalProducts,
    totalOrders,
  })

  renderOrderPaymentTypeChart({
    ctx: orderPaymentTypeChartCtx,
    labels: ordersPerCategories.categoryNames,
    data: ordersPerCategories.orderCounts
  })
  // * chart functions call end


  // * revenue line chart
  function renderRevenueChart({ ctx, totalRegisters, totalOrders, totalProducts }) {
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Users',
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(44, 120, 220, 0.2)',
          borderColor: 'rgba(44, 120, 220)',
          data: totalRegisters
        },
        {
          label: 'Products',
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(4, 209, 130, 0.2)',
          borderColor: 'rgb(4, 209, 130)',
          data: totalProducts
        },
        {
          label: 'Orders',
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(380, 200, 230, 0.2)',
          borderColor: 'rgb(380, 200, 230)',
          data: totalOrders
        }
        ]
      },
      options: {
        plugins: {
          legend: {
            labels: {
              usePointStyle: true,
            },
          }
        }
      }
    });
  }


  // * orderPaymentTypes round chart 
  var orderPaymentTypesChart
  function renderOrderPaymentTypeChart({ ctx, labels, data }) {
    orderPaymentTypesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'categories',
          // data: [12, 19, 3, 5, 2, 3],
          data: data,
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      },
      plugins: {
        beforeDraw: function (chartInstance) {
          chartInstance.chart.canvas.style.height = '200px';
        }
      }
    });
  };

  // * dropdown element click functions
  dayDropdown.find('.dropdown-item').on('click', function () {
    const day = $(this).text().trim()
    console.log('handle day', day)
    dayDropdownBtn.text(day)
    monthDropdownBtn.text('Month')
    yearDropdownBtn.text('Year')
    updateCategoryWiseOrder({ name: 'day', value: day })
  })

  monthDropdown.find('.dropdown-item').on('click', function () {
    const month = $(this).attr('data-value')
    const monthName = $(this).text().trim()
    console.log('handle month', month)
    monthDropdownBtn.text(monthName)
    dayDropdownBtn.text('Day')
    yearDropdownBtn.text('Year')
    updateCategoryWiseOrder({ name: 'month', value: month })
  })

  yearDropdown.find('.dropdown-item').on('click', function () {
    const year = $(this).text().trim()
    console.log('handle year', year)
    yearDropdownBtn.text(year)
    monthDropdownBtn.text('Month')
    dayDropdownBtn.text('Day')
    updateCategoryWiseOrder({name:'year',value:year})
  })

  // * get category wise sales ajax call
  function updateCategoryWiseOrder({ name, value }) {
    $.ajax({
      url: `/admin//categoryWiseOrders?${name}=${value}`,
      method: 'GET',
      success: function (data) {
        if (!data) {
          showAlert('no data found')
          return
        }
        console.log(data)
        if (orderPaymentTypesChart) {
          orderPaymentTypesChart.destroy();
        }
        renderOrderPaymentTypeChart({
          ctx: orderPaymentTypeChartCtx,
          labels: data.ordersPerCategories.categoryNames,
          data: data.ordersPerCategories.orderCounts
        })

      },
      error: function (xhr, status, error) {
        const res = JSON.parse(xhr.responseText)
        showAlert(res.message)
        console.log(error)
      }
    })
  }

  // * dropdown element click functions end


  // * day ,month ,year selector functions
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
    const filteredMonths = months.slice(0, currentMonth + 1);
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
  // * day ,month ,year selector functions end





})