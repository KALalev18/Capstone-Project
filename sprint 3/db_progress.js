// Create an interpolation line chart for the progress card
var ctx2 = document.getElementById('progressChart').getContext('2d');
var progressChart = new Chart(ctx2, {
    type: 'line',
    data: {
        labels: [
          "2020-01-01", "2020-04-01", "2020-07-01", "2020-10-01",
          "2021-01-01", "2022-01-01", "2022-06-01", "2023-01-01",
          "2023-07-01", "2024-01-01", "2024-06-01", "2024-12-31"
        ],
        datasets: [{
          label: 'Commits per Day',
          data: [10, 15, 12, 18, 20, 25, 22, 30, 28, 35, 33, 40],
          fill: false,
          borderColor: 'rgba(198, 13, 223, 0.91)',
          tension: 0.5  // smooth interpolation curve
        }]
    },
    options: {
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    color: '#fff'
                },
                grid: {
                    display: true,
                    drawBorder: true,
                    color: 'rgba(255, 255, 255, 0.05)', // grid lines become semi-transparent white
                    borderColor: '#fff'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Commits',
                },
                grid: {
                    display: true,
                    drawBorder: true,
                    color: 'rgba(255, 255, 255, 0.05)', // grid lines become semi-transparent white
                    borderColor: '#fff'
                }
            }
        },
        animation: {
            duration: 2000, // duration of the animation in milliseconds
            easing: 'easeInOutQuad', // easing function
            onComplete: () => {
                delayed = true;
            },
            delay: (context) => {
                let delay = 0;
                if (context.type === 'data' && context.mode === 'default' && !delayed) {
                    delay = context.dataIndex * 150 + context.datasetIndex * 100;
                }
                return delay;
            },
        },
        interaction: {
            intersect: false
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Commits per Day'
            }
        }
    }
});

