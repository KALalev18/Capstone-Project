var ctx3 = document.getElementById('codinghrsChart').getContext('2d');
var delayed;
var codinghrsChart = new Chart(ctx3, {
  type: 'bar',
  data: {
    labels: [
      "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am",
      "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm",
      "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"
    ],
    datasets: [{
      label: 'Coding Hours',
      data: [
        0.1, 0.12, 0.09, 0.15, 0.05, 0.25, 0.2, 0.18,
        0.3, 0.28, 0.22, 0.11, 0.07, 0.13, 0.12, 0.1,
        0.08, 0.09, 0.14, 0.2, 0.27, 0.3, 0.15, 0.1
      ],
      backgroundColor: 'rgba(198, 13, 223, 0.91)',
      borderColor: 'rgba(172, 9, 212, 0.55)',
      borderWidth: 1,
      borderRadius: {
        topLeft: 30,
        topRight: 30,
        bottomLeft: 10,
        bottomRight: 10
      },
      borderSkipped: false // Apply border radius to all corners
    }]
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: false,
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        max: 0.35,
        title: {
          display: true,
          text: 'Average Coding Hours'
        },
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
  }
});