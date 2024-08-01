$(function () {
  var totalRegisters = window.totalRegisters
  var totalProducts = window.totalProducts
  var totalOrders = window.totalOrders

  const revenueChart = document.getElementById('revenueChart');
  const ctx = revenueChart.getContext('2d');

  

  // * revenue line chart
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
  // * revenue line chart end




})