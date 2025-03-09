document.addEventListener('DOMContentLoaded', function () {
  const ctx = document.getElementById('contributionChart').getContext('2d');
  const contributionChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Frank', 'Dan', 'Felix', 'Ben', 'Others'], 
      datasets: [{
        label: 'Contributions',
        data: [10, 20, 30, 12, 45], 
        backgroundColor: [
          'rgb(255, 99, 133)',
          'rgb(54, 163, 235)',
          'rgb(255, 207, 86)',
          'rgb(9, 189, 63)',
          'rgb(212, 12, 202)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgb(9, 189, 63, 1)',
          'rgb(212, 12, 202, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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