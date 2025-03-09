document.addEventListener('DOMContentLoaded', function () {
  const ctx = document.getElementById('issuesDoughnutChart').getContext('2d');
  const issuesDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Open', 'Closed'],
      datasets: [{
        data: [10, 20], 
        backgroundColor: ['rgb(112, 255, 99)', 'rgb(223, 14, 14)'],
        hoverBackgroundColor: ['rgba(112, 255, 99, 0.38)', 'rgba(223, 14, 14, 0.38)'],
        borderColor: 'rgba(243, 243, 243, 0.55)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.label + ': ' + tooltipItem.raw;
            }
          }
        }
      },
      animation: {
        onComplete: () => {
          delayed = true;
        },
        delay: (context) => {
          let delay = 0;
          if (context.type === 'data' && context.mode === 'default' && !delayed) {
            delay = context.dataIndex * 200 + context.datasetIndex * 100;
          }
          return delay;
        },
      }
    }
  });
});