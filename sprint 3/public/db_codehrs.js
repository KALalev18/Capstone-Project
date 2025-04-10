var ctx3 = document.getElementById('codinghrsChart').getContext('2d');
var delayed;
var codinghrsChart = new Chart(ctx3, {
  type: 'line',
  data: {
    labels: [
      "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am",
      "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm",
      "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"
    ],
    datasets: [{
      label: 'Average Coding Hours',
      data: [],
      fill: false,
      backgroundColor: 'rgba(198, 13, 223, 0.91)',
      borderColor: 'rgba(198, 13, 223, 0.91)',
      borderWidth: 2,
      tension: 0.5  // Adds smooth curve interpolation
    }]
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time of Day',
          color: '#fff'
        },
        grid: {
          display: true,
          drawBorder: true,
          color: 'rgba(255, 255, 255, 0.05)',
          borderColor: '#fff'
        },
        ticks: {
          color: '#fff',
          autoSkip: true,
          maxTicksLimit: 15
        }
      },
      y: {
        beginAtZero: true,
        max: 0.4, // Default max value, will be updated dynamically
        title: {
          display: true,
          text: 'Average Coding Hours',
          color: '#fff'
        },
        grid: {
          display: true,
          drawBorder: true,
          color: 'rgba(255, 255, 255, 0.05)',
          borderColor: '#fff'
        },
        ticks: {
          color: '#fff'
        }
      }
    },
    animation: {
      duration: 100,
      easing: 'easeInOutQuad',
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
        text: 'Average Coding Hours',
        color: '#fff'
      }
      // Zoom plugin removed as requested
    }
  }
});

// Add global variables to store date filter
let dateFilterStart = null;
let dateFilterEnd = null;

// Add a listener for date range selection
document.addEventListener('dateRangeSelected', function(event) {
    dateFilterStart = event.detail.start;
    dateFilterEnd = event.detail.end;
    
    // Get current selected contributor from dropdown
    const contributorDropdown = document.getElementById('mySelect');
    const selectedContributor = contributorDropdown.value === "1" ? "all" : contributorDropdown.value;
    
    // Refresh chart with date filter
    fetchAverageCodingHours(selectedContributor);
});

// Add a listener for date selection reset
document.addEventListener('dateSelectionReset', function(event) {
    // Reset date filters
    dateFilterStart = null;
    dateFilterEnd = null;
    
    // Get the contributor from the event
    const contributor = event.detail.contributor === "1" ? "all" : event.detail.contributor;
    
    // Update the chart without date filtering
    fetchAverageCodingHours(contributor);
});

// Modify the function to accept an optional contributor parameter AND use date filter
async function fetchAverageCodingHours(contributor = "all") {
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
  let page = 1;
  let hasCommitsInDateRange = false;

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

        // Check if this commit is within date range if filter is active
        let isInDateRange = true;
        if (dateFilterStart && dateFilterEnd) {
          // Set hours to 0 for proper date comparison
          const compareDate = new Date(dateStr);
          compareDate.setHours(0, 0, 0, 0);
          dateFilterStart.setHours(0, 0, 0, 0);
          dateFilterEnd.setHours(0, 0, 0, 0);
          
          isInDateRange = compareDate >= dateFilterStart && compareDate <= dateFilterEnd;
        }

        // Count this commit if no filter is set OR commit's author matches the selected contributor AND is in date range
        if ((contributor === "all" || (commit.author && commit.author.login === contributor)) && isInDateRange) {
          hourCounts[commitHour]++;
          uniqueDates.add(dateStr);
          hasCommitsInDateRange = true;
        }
      });

      // Check for next page in GitHub pagination headers
      const linkHeader = response.headers.get("Link");
      const nextPageMatch = linkHeader ? linkHeader.match(/<([^>]+)>;\s*rel="next"/) : null;
      apiUrl = nextPageMatch ? nextPageMatch[1] : null;
    }

    // Display message if no commits in date range
    if (dateFilterStart && dateFilterEnd && !hasCommitsInDateRange) {
      document.getElementById('selected-date').textContent = "No commits made on selected days";
      // Clear chart data
      updateCodingHoursChart(new Array(24).fill(0), contributor);
      return;
    }

    const totalDays = uniqueDates.size || 1; // Avoid division by zero
    const avgHourlyCommits = hourCounts.map(count => Math.ceil((count / totalDays) * 100) / 100);

    updateCodingHoursChart(avgHourlyCommits, contributor);
  } catch (error) {
    console.error("Error fetching commits:", error);
  }
}

// Modify the existing function to accept an optional contributor parameter
function updateCodingHoursChart(avgHourlyCommits, contributor = "all") {
    const maxAvg = Math.max(...avgHourlyCommits);
    const yAxisMax = Math.ceil(maxAvg * 10) / 10; // Round up to nearest 0.1
    
    // Check if we have any data
    const hasData = avgHourlyCommits.some(val => val > 0);
    
    // Update the chart container
    const chartContainer = document.querySelector('.codinghrs-chart');
    
    if (!hasData) {
        if (dateFilterStart) {
            // If we have a date filter but no data
            codinghrsChart.options.plugins.title.text = 'No coding activity in selected date range';
        } else if (contributor !== "all") {
            // If we have a contributor selected but no data
            codinghrsChart.options.plugins.title.text = `No coding activity for selected contributor`;
        } else {
            // Default title
            codinghrsChart.options.plugins.title.text = 'Average Coding Hours';
        }
    } else {
        // If we have data, show appropriate title
        if (contributor !== "all" && dateFilterStart) {
            codinghrsChart.options.plugins.title.text = `Average Coding Hours for selected contributor in date range`;
        } else if (contributor !== "all") {
            codinghrsChart.options.plugins.title.text = `Average Coding Hours for selected contributor`;
        } else if (dateFilterStart) {
            codinghrsChart.options.plugins.title.text = 'Average Coding Hours in selected date range';
        } else {
            codinghrsChart.options.plugins.title.text = 'Average Coding Hours';
        }
    }

    codinghrsChart.data.datasets[0].data = avgHourlyCommits;
    codinghrsChart.options.scales.y.max = yAxisMax || 0.1; // Set minimum scale to 0.1 if no data
    codinghrsChart.update();
}

// Initially fetch and update the chart with whole repo data
fetchAverageCodingHours();

// Modify the existing dropdown change listener to preserve date filters when appropriate
document.getElementById('mySelect').addEventListener('change', function() {
    const selectedValue = this.value.trim();
    const codingChartContainer = document.querySelector('.codinghrs-chart');

    // Show chart in any case
    codingChartContainer.style.display = 'block';

    // When changing contributors, we'll either:
    // 1. Keep the existing date filter if one is set (handled by dateRangeSelected event)
    // 2. Otherwise, immediately show data for the selected contributor (handled above by dateSelectionReset event)
    // This ensures automatic chart updates without requiring additional steps
});