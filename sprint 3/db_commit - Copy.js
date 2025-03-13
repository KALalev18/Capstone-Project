var ctx = document.getElementById('commitsChart').getContext('2d');
var delayed;
var commitsChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Commit Activity',
            data: [12, 19, 3, 5, 2, 6, 13],
            backgroundColor: 'rgba(198, 13, 223, 0.91)',
            borderColor: 'rgba(172, 9, 212, 0.55)',
            drawBorder: true,
            borderWidth: 1
        }],
    },
    options: {
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false,
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(255, 255, 255, 0.05)'
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
        },
    },
});

