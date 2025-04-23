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
          data: [0, 15, 12, 18, 20, 25, 22, 30, 28, 35, 33, 40],
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
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 15,
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                // Ensure the maximum value matches the last commit date.
                // (This assumes you update progressChart.data.labels dynamically with your commit dates.)
                max: undefined // You can set: max: labels[labels.length - 1] when updating data.
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
                },
                max: 10 // default; gets updated dynamically
            }
        },
        animation: {
            duration: 100, // duration of the animation in milliseconds
            easing: 'easeInOutQuad', // easing function
            onComplete: () => {
                delayed = true;
            },
            delay: (context) => {
                let delay = 1;
                if (context.type === 'data' && context.mode === 'default' && !delayed) {
                    delay = context.dataIndex * 300 + context.datasetIndex * 100;
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
            },
            zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'x'
                }
            }
        }
    }
});

// Helper function to format dates as yyyy-mm-dd for x-axis labels.
function formatXAxisDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Update progress chart based on commit data
function updateProgressChart() {

    // Ensure commit data is available (set in db_commit.js)
    if (!window.allCommits || window.allCommits.length === 0) {
        console.error('No commit data available to update progress chart.');
        return;
    }

    // Group commits by day using the yyyy-mm-dd format
    const commitCountsByDay = {};
    window.allCommits.forEach(commit => {
        const d = new Date(commit?.commit?.author?.date);
        if (!isNaN(d)) {
            const label = formatXAxisDate(d);
            commitCountsByDay[label] = (commitCountsByDay[label] || 0) + 1;
        }
    });

    // Generate sorted labels (all dates) & corresponding counts
    const labels = Object.keys(commitCountsByDay).sort((a, b) => new Date(a) - new Date(b));
    const counts = labels.map(label => commitCountsByDay[label]);

    // Determine the maximum count and round up to the nearest 10
    const maxCount = Math.max(...counts);
    const yAxisMax = Math.ceil(maxCount / 10) * 10 || 10;

    // Update progress chart data and options
    progressChart.data.labels = labels;       
    progressChart.data.datasets[0].data = counts;
    progressChart.options.scales.y.max = yAxisMax;

    // Set x-axis max to the last date from your labels array
    if (labels.length > 0) {
        progressChart.options.scales.x.max = labels[labels.length - 1];
    }

    // Configure the x-axis to display at most 15 ticks
    progressChart.options.scales.x.ticks = {
        autoSkip: true,
        maxTicksLimit: 15,
        color: '#fff'
    };

    progressChart.update();
}





