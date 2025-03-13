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
      data: [],
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
        max: 0.4, // Default max value, will be updated dynamically
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

async function fetchAverageCodingHours() {
  const repoUrl = window.repoUrl;
  const githubToken = window.githubToken;
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (!match) {
    console.error('Invalid GitHub URL');
    return;
  }

  const username = match[1];
  const repository = match[2];
  let apiUrl = `https://api.github.com/repos/${username}/${repository}/commits?per_page=100&page=1`;
  let hourCounts = new Array(24).fill(0);
  let uniqueDates = new Set();
  let commitCount = 0;
  let page = 1;

  try {
    while (apiUrl) {
      const response = await fetch(apiUrl, {
        headers: { Authorization: `token ${githubToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.length) break; // Stop if no more commits

      data.forEach(commit => {
        const commitDate = new Date(commit.commit.author.date);
        const commitHour = commitDate.getHours();
        const dateStr = commitDate.toISOString().split('T')[0];

        hourCounts[commitHour]++;
        uniqueDates.add(dateStr);
        commitCount++;
      });

      // Check for next page in GitHub pagination headers
      const linkHeader = response.headers.get("Link");
      const nextPageMatch = linkHeader ? linkHeader.match(/<([^>]+)>;\s*rel="next"/) : null;
      apiUrl = nextPageMatch ? nextPageMatch[1] : null;
    }

    const totalDays = uniqueDates.size || 1; // Avoid division by zero
    const avgHourlyCommits = hourCounts.map(count => Math.ceil((count / totalDays) * 100) / 100);

    updateCodingHoursChart(avgHourlyCommits);
  } catch (error) {
    console.error("Error fetching commits:", error);
  }
}

function updateCodingHoursChart(avgHourlyCommits) {
  const maxAvg = Math.max(...avgHourlyCommits);
  const yAxisMax = Math.ceil(maxAvg * 10) / 10; // Round up to nearest 0.1

  codinghrsChart.data.datasets[0].data = avgHourlyCommits;
  codinghrsChart.options.scales.y.max = yAxisMax;
  codinghrsChart.update();
}

// Fetch and update the chart with average coding hours data
fetchAverageCodingHours();