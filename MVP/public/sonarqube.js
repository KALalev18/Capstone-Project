//https://sonarcloud.io/

document.addEventListener('DOMContentLoaded', function() {
  const sonarToken = 'c500d715157c8ca1fb6db442bb7ea60ec9a894a3';
  let sonarUrl = '';
  let projectKey = '';
  
  // Add these global variables for date filtering
  let sonarQubeDateFilterStart = null;
  let sonarQubeDateFilterEnd = null;
  
  // Add a session flag to track if SonarQube is connected in the current session
  let sonarQubeConnected = false;
  
  // Clear any existing SonarQube data on page load
  localStorage.removeItem('sonarQubeUrl');
  localStorage.removeItem('sonarQubeProjectKey');

  // Setup the connect button
  const connectButton = document.getElementById('connect-sonarqube');
  if (connectButton) {
    connectButton.addEventListener('click', promptForSonarQubeUrl);
  }

  // Setup dropdown event listener
  const dropdown = document.getElementById('sonarqube-dropdown');
  if (dropdown) {
    dropdown.addEventListener('change', function() {
      const selectedValue = this.value;
      
      // Only update charts if connected in current session
      if (sonarQubeConnected && localStorage.getItem('sonarQubeProjectKey')) {
        switch (selectedValue) {
          case '1': // Issues
            fetchIssuesData('https://sonarcloud.io', localStorage.getItem('sonarQubeProjectKey'));
            break;
          case '2': // Coverage
            fetchCoverageData('https://sonarcloud.io', localStorage.getItem('sonarQubeProjectKey'));
            break;
          case '3': // Duplications
            fetchDuplicationsData('https://sonarcloud.io', localStorage.getItem('sonarQubeProjectKey'));
            break;
        }
      }
    });
  }
  
  // Also set up event listener for the custom dropdown
  document.addEventListener('contributorChanged', function(event) {
    if (event.target.id === 'sonarqube-dropdown') {
      const selectedValue = event.detail.value;
      
      // Only update charts if connected in current session
      if (sonarQubeConnected && localStorage.getItem('sonarQubeProjectKey')) {
        switch (selectedValue) {
          case '1': // Issues
            fetchIssuesData('https://sonarcloud.io', localStorage.getItem('sonarQubeProjectKey'));
            break;
          case '2': // Coverage
            fetchCoverageData('https://sonarcloud.io', localStorage.getItem('sonarQubeProjectKey'));
            break;
          case '3': // Duplications
            fetchDuplicationsData('https://sonarcloud.io', localStorage.getItem('sonarQubeProjectKey'));
            break;
        }
      }
    }
  });

  // Add event listeners for calendar date range selection
  document.addEventListener('dateRangeSelected', function(event) {
    sonarQubeDateFilterStart = event.detail.start;
    sonarQubeDateFilterEnd = event.detail.end;
    
    // Only update charts if connected in current session
    if (sonarQubeConnected && localStorage.getItem('sonarQubeProjectKey')) {
      const dropdown = document.getElementById('sonarqube-dropdown');
      if (dropdown) {
        const selectedValue = dropdown.value;
        updateSonarQubeChartWithDateFilter(selectedValue);
      }
      
      // Directly update the quality chart as well to make sure it's always updated
      const projectKey = localStorage.getItem('sonarQubeProjectKey');
      if (projectKey) {
        fetchCodeQualityData('https://sonarcloud.io', projectKey);
      }
    }
  });
  
  // Add event listener for date selection reset
  document.addEventListener('dateSelectionReset', function(event) {
    sonarQubeDateFilterStart = null;
    sonarQubeDateFilterEnd = null;
    
    // Only update charts if connected in current session
    if (sonarQubeConnected && localStorage.getItem('sonarQubeProjectKey')) {
      const dropdown = document.getElementById('sonarqube-dropdown');
      if (dropdown) {
        const selectedValue = dropdown.value;
        updateSonarQubeChartWithDateFilter(selectedValue);
      }
      
      // Directly update the quality chart as well
      const projectKey = localStorage.getItem('sonarQubeProjectKey');
      if (projectKey) {
        fetchCodeQualityData('https://sonarcloud.io', projectKey);
      }
    }
  });
  
  // Function to update charts based on selection and date filter
  function updateSonarQubeChartWithDateFilter(chartType) {
    const projectKey = localStorage.getItem('sonarQubeProjectKey');
    if (!projectKey || !sonarQubeConnected) return;
    
    switch (chartType) {
      case '1': // Issues
        fetchIssuesData('https://sonarcloud.io', projectKey);
        break;
      case '2': // Coverage
        fetchCoverageData('https://sonarcloud.io', projectKey);
        break;
      case '3': // Duplications
        fetchDuplicationsData('https://sonarcloud.io', projectKey);
        break;
    }
    

    fetchCodeQualityData('https://sonarcloud.io', projectKey);
  }
  
  // Format date helper function for display
  function formatDate(date) {
    const day = date.getDate();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';
    
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString();
    
    return `${day}${suffix} ${month} ${year}`;
  }

  // Check if we have stored SonarQube URL and project key
  const storedSonarUrl = localStorage.getItem('sonarQubeUrl');
  const storedProjectKey = localStorage.getItem('sonarQubeProjectKey');
  
  // Don't automatically load data on page load
  // Only load if user explicitly clicks Connect after page reload

  function promptForSonarQubeUrl() {
    // Create a modal for the input
    const modal = document.createElement('div');
    modal.className = 'sonar-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'sonar-modal-content';
    
    const closeButton = document.createElement('span');
    closeButton.className = 'sonar-close-button';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => document.body.removeChild(modal);
    
    const form = document.createElement('div');
    form.className = 'sonar-form';
    
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'SonarCloud URL (e.g., https://sonarcloud.io/project/overview?id=project-key)';
    
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'https://sonarcloud.io/project/overview?id=project-key';
    urlInput.className = 'sonar-input';
    
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Connect';
    submitButton.className = 'sonar-submit';
    submitButton.onclick = () => {
      const url = urlInput.value.trim();
      
      if (!url) {
        alert('Please provide a SonarCloud URL');
        return;
      }

      // Extract the project key from the URL
      let projectKey = '';
      try {
        const urlObj = new URL(url);
        if (urlObj.searchParams.has('id')) {
          projectKey = urlObj.searchParams.get('id');
          // Decode the URL-encoded characters (like %3A to :)
          projectKey = decodeURIComponent(projectKey);
        } else {
          throw new Error("Could not find 'id' parameter in URL");
        }
      } catch (error) {
        alert(`Invalid URL format: ${error.message}`);
        return;
      }

      if (!projectKey) {
        alert('Could not extract project key from URL');
        return;
      }

      // Store values in localStorage
      localStorage.setItem('sonarQubeUrl', 'https://sonarcloud.io');
      localStorage.setItem('sonarQubeProjectKey', projectKey);
      
      // Set the connected flag to true for this session
      sonarQubeConnected = true;
      
      // Close modal
      document.body.removeChild(modal);
      
      // Show loading indicator only after user initiates the connection
      const statusElement = document.getElementById('quality-gate-status');
      if (statusElement) {
        statusElement.innerHTML = '<div class="loading">Loading...</div>';
      }
      
      // Fetch quality gate data first
      fetchQualityGateData('https://sonarcloud.io', projectKey, sonarToken)
        .then(() => {
          // Once quality gate data is fetched successfully, fetch issues data
          // And ensure the dropdown is set to "Issues"
          const dropdown = document.getElementById('sonarqube-dropdown');
          if (dropdown) {
            dropdown.value = '1'; // Set to "Issues" option
            
            // If using a custom dropdown, update the display text too
            const customDropdown = dropdown.nextElementSibling;
            if (customDropdown && customDropdown.classList.contains('dropdown-select')) {
              const currentSpan = customDropdown.querySelector('.current');
              if (currentSpan) {
                currentSpan.textContent = 'Issues';
              }
            }
          }
          
          // Only fetch the issues data initially
          fetchIssuesData('https://sonarcloud.io', projectKey);
          
          // Fetch code quality data
          fetchCodeQualityData('https://sonarcloud.io', projectKey);
        })
        .catch(error => {
          console.error('Error during SonarQube connection:', error);
          sonarQubeConnected = false; // Reset the connection flag
        });
    };
    
    form.appendChild(urlLabel);
    form.appendChild(urlInput);
    form.appendChild(submitButton);
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
  }

  // Modify the fetchQualityGateData function to show the dropdown after successful connection
  async function fetchQualityGateData(baseUrl, projectKey, token) {
    try {
      const statusElement = document.getElementById('quality-gate-status');
      
      if (!statusElement) {
        console.error('SonarQube elements not found in the DOM');
        return;
      }
      
      statusElement.innerHTML = '<div class="loading">Fetching quality gate data...</div>';
      
      // Use public API endpoint for component measures - just get the basic info
      const metrics = 'alert_status,quality_gate_details';
      const apiUrl = `${baseUrl}/api/measures/component?component=${projectKey}&metricKeys=${metrics}`;
      
      console.log('Fetching quality gate data from:', apiUrl);
      
      // Using external API that allows CORS
      const mockDataUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
      
      console.log('Using proxy URL:', mockDataUrl);
      
      const response = await fetch(mockDataUrl);
      
      if (!response.ok) {
        throw new Error(`Quality gate API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('SonarCloud quality gate data:', data);
      
      // Check if we have component data
      if (!data.component) {
        throw new Error('No component data found in response');
      }
      
      // Display basic project info
      const projectName = data.component.name || projectKey;
      
      // Process metrics - extract only alert status
      const measures = data.component.measures || [];
      const alertStatus = measures.find(m => m.metric === 'alert_status')?.value || 'UNKNOWN';
      
      // Process the status
      let statusClass = '';
      let statusText = '';
      
      switch (alertStatus) {
        case 'OK':
          statusClass = 'status-passed';
          statusText = 'Passed';
          break;
        case 'ERROR':
          statusClass = 'status-failed';
          statusText = 'Failed';
          break;
        case 'WARN':
          statusClass = 'status-warning';
          statusText = 'Warning';
          break;
        default:
          statusClass = 'status-unknown';
          statusText = 'Unknown';
      }
      
      statusElement.innerHTML = `
        <div class="quality-gate ${statusClass}">
          <div class="status-icon"></div>
          <div class="status-text">
            <h4>Quality Gate: ${statusText}</h4>
            <p>Project: ${projectName}</p>
          </div>
        </div>
      `;
      
      // Show the dropdown container after successful connection
      const dropdownContainer = document.getElementById('sonarqube-dropdown-container');
      if (dropdownContainer) {
        dropdownContainer.style.display = 'block';
      }
      
      // Connection succeeded
      sonarQubeConnected = true;
      
    } catch (error) {
      console.error('Error fetching SonarQube data:', error);
      const statusElement = document.getElementById('quality-gate-status');
      if (statusElement) {
        statusElement.innerHTML = `
          <div class="quality-gate status-error">
            <div class="status-icon"></div>
            <div class="status-text">
              <h4>Error connecting to SonarCloud</h4>
              <p>${error.message}</p>
            </div>
          </div>
        `;
      }
      
      // Connection failed, reset the connection flag
      sonarQubeConnected = false;
      
      // Hide dropdown in case of error
      const dropdownContainer = document.getElementById('sonarqube-dropdown-container');
      if (dropdownContainer) {
        dropdownContainer.style.display = 'none';
      }
      
      // Clear the chart container
      const chartContainer = document.getElementById('sonarqube-issues-chart');
      if (chartContainer) {
        chartContainer.innerHTML = '';
      }
    }
  }

  function formatMetricName(metricKey) {
    // Convert snake_case to readable format
    return metricKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async function fetchIssuesData(baseUrl, projectKey) {
    try {
      const chartContainer = document.getElementById('sonarqube-issues-chart');
      if (!chartContainer) {
        console.error('Issues chart container not found');
        return;
      }
  
      chartContainer.innerHTML = '<div class="loading">Fetching issues data...</div>';
      
      // Using the measures history endpoint to get data over time
      const historyApiUrl = `${baseUrl}/api/measures/search_history?component=${projectKey}&metrics=violations&ps=100`;
      
      console.log('Fetching issues history from:', historyApiUrl);
      
      // Using the CORS proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(historyApiUrl)}`;
      console.log('Using proxy URL for issues history:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Issues history API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('SonarCloud issues history data:', data);
      
      // Process the data for the chart
      const measures = data.measures || [];
      
      if (!measures.length) {
        chartContainer.innerHTML = '<div class="chart-error">No issues history available</div>';
        return;
      }
      
      // We'll use a Map to store data by month/year
      const dataByMonth = new Map();
      let hasDataInDateRange = false;
      
      // Process all history points
      measures.forEach(measure => {
        if (measure.history && Array.isArray(measure.history)) {
          measure.history.forEach(point => {
            const date = new Date(point.date);
            
            // Skip points outside date range if filter is active
            if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
              // Compare dates at day level only
              const compareDate = new Date(date);
              compareDate.setHours(0, 0, 0, 0);
              sonarQubeDateFilterStart.setHours(0, 0, 0, 0);
              sonarQubeDateFilterEnd.setHours(0, 0, 0, 0);
              
              if (compareDate < sonarQubeDateFilterStart || compareDate > sonarQubeDateFilterEnd) {
                return; // Skip this point as it's outside the date range
              }
              
              hasDataInDateRange = true;
            }
            
            // Create a key in format "YYYY-MM" for grouping by month
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            // Format display label (e.g., "Apr/25")
            const monthLabel = `${date.toLocaleString('default', { month: 'short' })}/${date.getFullYear().toString().substr(-2)}`;
            
            // If this month doesn't exist in our map yet, add it
            if (!dataByMonth.has(monthKey)) {
              dataByMonth.set(monthKey, {
                key: monthKey,
                label: monthLabel,
                value: parseFloat(point.value) || 0,
                date: date,
                displayOrder: date.getTime() // For sorting
              });
            } else {
              // For multiple data points in the same month, use the most recent one
              const existing = dataByMonth.get(monthKey);
              if (date > existing.date) {
                existing.value = parseFloat(point.value) || 0;
                existing.date = date;
              }
            }
          });
        }
      });
      
      // Show message if filtered data is empty
      if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd && !hasDataInDateRange) {
        chartContainer.innerHTML = '<div class="chart-error">No issues data available in selected date range</div>';
        return;
      }
      
      console.log('Data grouped by month:', Array.from(dataByMonth.values()));
      
      // Sort by date (oldest first)
      const sortedData = Array.from(dataByMonth.values()).sort((a, b) => a.displayOrder - b.displayOrder);
      
      // Prepare chart data
      const chartData = {
        labels: sortedData.map(item => item.label),
        datasets: [{
          label: 'Total Issues',
          data: sortedData.map(item => item.value),
          borderColor: '#e90bcb',
          backgroundColor: 'rgba(233, 11, 203, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#e90bcb'
        }]
      };
      
      // Create chart if we have data
      if (chartData.labels.length > 0) {
        // Clear loading indicator
        chartContainer.innerHTML = '';
        
        // Set explicit height for chart container
        chartContainer.style.height = '400px';
        
        // Add date range title if filter is active
        if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
          const titleDiv = document.createElement('div');
          titleDiv.className = 'chart-date-range';
          titleDiv.textContent = `Issues data from ${formatDate(sonarQubeDateFilterStart)} to ${formatDate(sonarQubeDateFilterEnd)}`;
          chartContainer.appendChild(titleDiv);
        }
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        // Create the chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems) {
                    const index = tooltipItems[0].dataIndex;
                    const item = sortedData[index];
                    // Return just the month/year label without the time
                    return item.label;
                  },
                  label: function(context) {
                    return `Issues: ${context.parsed.y}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.7)' }
              },
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                  color: 'rgba(255, 255, 255, 0.7)',
                  precision: 0
                }
              }
            }
          }
        });
      } else {
        chartContainer.innerHTML = '<div class="chart-error">No issues data available</div>';
      }
    } catch (error) {
      console.error('Error fetching SonarQube issues data:', error);
      const chartContainer = document.getElementById('sonarqube-issues-chart');
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div class="chart-error">
            <p>Error loading issues chart: ${error.message}</p>
            <p>The API might have restrictions for your project.</p>
          </div>
        `;
      }
    }
  }

  // Replace the fetchCoverageData function
  async function fetchCoverageData(baseUrl, projectKey) {
    try {
      const chartContainer = document.getElementById('sonarqube-issues-chart');
      if (!chartContainer) {
        console.error('Chart container not found');
        return;
      }
    
      chartContainer.innerHTML = '<div class="loading">Fetching coverage data...</div>';
      
      // Using the measures history endpoint to get coverage data over time
      // Get both coverage percentage and lines to cover/uncovered lines
      const historyApiUrl = `${baseUrl}/api/measures/search_history?component=${projectKey}&metrics=coverage,lines_to_cover,uncovered_lines&ps=100`;
      
      console.log('Fetching coverage history from:', historyApiUrl);
      
      // Using the CORS proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(historyApiUrl)}`;
      console.log('Using proxy URL for coverage history:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Coverage history API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('SonarCloud coverage history data:', data);
      
      // Process the data for the chart
      const measures = data.measures || [];
      
      if (!measures.length) {
        chartContainer.innerHTML = '<div class="chart-error">No coverage history available</div>';
        return;
      }
      
      // We'll use a Map to store data by month/year
      const dataByMonth = new Map();
      let hasDataInDateRange = false;
      
      // First, process all measures to group them by date
      measures.forEach(measure => {
        if (measure.history && Array.isArray(measure.history)) {
          measure.history.forEach(point => {
            const date = new Date(point.date);
            
            // Skip points outside date range if filter is active
            if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
              // Compare dates at day level only
              const compareDate = new Date(date);
              compareDate.setHours(0, 0, 0, 0);
              sonarQubeDateFilterStart.setHours(0, 0, 0, 0);
              sonarQubeDateFilterEnd.setHours(0, 0, 0, 0);
              
              if (compareDate < sonarQubeDateFilterStart || compareDate > sonarQubeDateFilterEnd) {
                return; // Skip this point as it's outside the date range
              }
              
              hasDataInDateRange = true;
            }
            
            // Create a key in format "YYYY-MM-DD HH:MM" for precise matching
            const dateKey = date.toISOString();
            
            // Format display label (e.g., "Apr/25")
            const monthLabel = `${date.toLocaleString('default', { month: 'short' })}/${date.getFullYear().toString().substr(-2)}`;
            
            // If this date doesn't exist in our map yet, add it
            if (!dataByMonth.has(dateKey)) {
              dataByMonth.set(dateKey, {
                key: dateKey,
                label: monthLabel,
                date: date,
                displayOrder: date.getTime(), // For sorting
                coveragePercent: 0,
                linesToCover: 0,
                uncoveredLines: 0,
                coveredLines: 0
              });
            }
            
            // Add the specific metric value to this date point
            const entry = dataByMonth.get(dateKey);
            if (measure.metric === 'coverage') {
              entry.coveragePercent = parseFloat(point.value) || 0;
            } else if (measure.metric === 'lines_to_cover') {
              entry.linesToCover = parseFloat(point.value) || 0;
            } else if (measure.metric === 'uncovered_lines') {
              entry.uncoveredLines = parseFloat(point.value) || 0;
            }
            
            // Calculate covered lines
            entry.coveredLines = Math.max(0, entry.linesToCover - entry.uncoveredLines);
          });
        }
      });
      
      // Group points by month for display
      const monthlyData = new Map();
      
      // Group by month-year and use the latest entry for each month
      Array.from(dataByMonth.values()).forEach(entry => {
        const date = entry.date;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey) || entry.date > monthlyData.get(monthKey).date) {
          monthlyData.set(monthKey, entry);
        }
      });
      
      // Show message if filtered data is empty
      if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd && !hasDataInDateRange) {
        chartContainer.innerHTML = '<div class="chart-error">No coverage data available in selected date range</div>';
        return;
      }
      
      console.log('Coverage data grouped by month:', Array.from(monthlyData.values()));
      
      // Sort by date (oldest first)
      const sortedData = Array.from(monthlyData.values()).sort((a, b) => a.displayOrder - b.displayOrder);
      
      // Find maximum value for y-axis
      const maxLinesToCover = Math.max(...sortedData.map(item => item.linesToCover));
      const yAxisMax = Math.ceil(maxLinesToCover * 1.1); // Add 10% padding
      
      // Prepare chart data
      const chartData = {
        labels: sortedData.map(item => item.label),
        datasets: [
          {
            label: 'Lines to Cover',
            data: sortedData.map(item => item.linesToCover),
            borderColor: '#4c75e6', // Blue color for lines to cover
            backgroundColor: 'rgba(76, 117, 230, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#4c75e6'
          },
          {
            label: 'Covered Lines',
            data: sortedData.map(item => item.coveredLines),
            borderColor: '#33ff8c', // Green color for covered lines
            backgroundColor: 'rgba(51, 255, 140, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#33ff8c'
          }
        ]
      };
      
      // Create chart if we have data
      if (chartData.labels.length > 0) {
        // Clear loading indicator
        chartContainer.innerHTML = '';
        
        // Set explicit height for chart container
        chartContainer.style.height = '400px';
        
        // Add date range title if filter is active
        if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
          const titleDiv = document.createElement('div');
          titleDiv.className = 'chart-date-range';
          titleDiv.textContent = `Coverage data from ${formatDate(sonarQubeDateFilterStart)} to ${formatDate(sonarQubeDateFilterEnd)}`;
          chartContainer.appendChild(titleDiv);
        }
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        // Create the chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems) {
                    const index = tooltipItems[0].dataIndex;
                    const item = sortedData[index];
                    // Return just the month/year label without the time
                    return item.label;
                  },
                  label: function(context) {
                    const index = context.dataIndex;
                    const item = sortedData[index];
                    
                    if (context.dataset.label === 'Lines to Cover') {
                      return `Lines to Cover: ${context.parsed.y}`;
                    } else {
                      return `Covered Lines: ${context.parsed.y} (${item.coveragePercent}%)`;
                    }
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.7)' }
              },
              y: {
                beginAtZero: true,
                max: yAxisMax, // Set to maximum lines to cover with padding
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                  color: 'rgba(255, 255, 255, 0.7)',
                  precision: 0
                }
              }
            }
          }
        });
      } else {
        chartContainer.innerHTML = '<div class="chart-error">No coverage data available</div>';
      }
    } catch (error) {
      console.error('Error fetching SonarQube coverage data:', error);
      const chartContainer = document.getElementById('sonarqube-issues-chart');
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div class="chart-error">
            <p>Error loading coverage chart: ${error.message}</p>
            <p>The API might have restrictions for your project.</p>
          </div>
        `;
      }
    }
  }

  // Replace the placeholder fetchDuplicationsData function with this implementation
  async function fetchDuplicationsData(baseUrl, projectKey) {
    try {
      const chartContainer = document.getElementById('sonarqube-issues-chart');
      if (!chartContainer) {
        console.error('Chart container not found');
        return;
      }
    
      chartContainer.innerHTML = '<div class="loading">Fetching duplication data...</div>';
      
      // Using the measures history endpoint to get duplication data over time
      const historyApiUrl = `${baseUrl}/api/measures/search_history?component=${projectKey}&metrics=ncloc,duplicated_lines,duplicated_lines_density&ps=100`;
      
      console.log('Fetching duplication history from:', historyApiUrl);
      
      // Using the CORS proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(historyApiUrl)}`;
      console.log('Using proxy URL for duplication history:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Duplication history API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('SonarCloud duplication history data:', data);
      
      // Process the data for the chart
      const measures = data.measures || [];
      
      if (!measures.length) {
        chartContainer.innerHTML = '<div class="chart-error">No duplication history available</div>';
        return;
      }
      
      // We'll use a Map to store data by date
      const dataByDate = new Map();
      let hasDataInDateRange = false;
      
      // First, process all measures to group them by date
      measures.forEach(measure => {
        if (measure.history && Array.isArray(measure.history)) {
          measure.history.forEach(point => {
            const date = new Date(point.date);
            
            // Skip points outside date range if filter is active
            if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
              // Compare dates at day level only
              const compareDate = new Date(date);
              compareDate.setHours(0, 0, 0, 0);
              sonarQubeDateFilterStart.setHours(0, 0, 0, 0);
              sonarQubeDateFilterEnd.setHours(0, 0, 0, 0);
              
              if (compareDate < sonarQubeDateFilterStart || compareDate > sonarQubeDateFilterEnd) {
                return; // Skip this point as it's outside the date range
              }
              
              hasDataInDateRange = true;
            }
            
            // Create a key in format "YYYY-MM-DD HH:MM" for precise matching
            const dateKey = date.toISOString();
            
            // Format display label (e.g., "Apr/25")
            const monthLabel = `${date.toLocaleString('default', { month: 'short' })}/${date.getFullYear().toString().substr(-2)}`;
            
            // If this date doesn't exist in our map yet, add it
            if (!dataByDate.has(dateKey)) {
              dataByDate.set(dateKey, {
                key: dateKey,
                label: monthLabel,
                date: date,
                displayOrder: date.getTime(), // For sorting
                ncloc: 0,
                duplicatedLines: 0,
                duplicationDensity: 0
              });
            }
            
            // Add the specific metric value to this date point
            const entry = dataByDate.get(dateKey);
            if (measure.metric === 'ncloc') {
              entry.ncloc = parseFloat(point.value) || 0;
            } else if (measure.metric === 'duplicated_lines') {
              entry.duplicatedLines = parseFloat(point.value) || 0;
            } else if (measure.metric === 'duplicated_lines_density') {
              entry.duplicationDensity = parseFloat(point.value) || 0;
            }
          });
        }
      });
      
      // Group points by month for display
      const monthlyData = new Map();
      
      // Group by month-year and use the latest entry for each month
      Array.from(dataByDate.values()).forEach(entry => {
        const date = entry.date;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey) || entry.date > monthlyData.get(monthKey).date) {
          monthlyData.set(monthKey, entry);
        }
      });
      
      // Show message if filtered data is empty
      if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd && !hasDataInDateRange) {
        chartContainer.innerHTML = '<div class="chart-error">No duplication data available in selected date range</div>';
        return;
      }
      
      console.log('Duplication data grouped by month:', Array.from(monthlyData.values()));
      
      // Sort by date (oldest first)
      const sortedData = Array.from(monthlyData.values()).sort((a, b) => a.displayOrder - b.displayOrder);
      
      // Find maximum value for y-axis
      const maxLines = Math.max(...sortedData.map(item => item.ncloc));
      const yAxisMax = Math.ceil(maxLines * 1.1); // Add 10% padding
      
      // Prepare chart data
      const chartData = {
        labels: sortedData.map(item => item.label),
        datasets: [
          {
            label: 'Lines of Code',
            data: sortedData.map(item => item.ncloc),
            borderColor: '#4c75e6', // Blue color for lines of code
            backgroundColor: 'rgba(76, 117, 230, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#4c75e6'
          },
          {
            label: 'Duplicated Lines',
            data: sortedData.map(item => item.duplicatedLines),
            borderColor: '#ff6347', // Tomato color for duplicated lines
            backgroundColor: 'rgba(255, 99, 71, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#ff6347'
          }
        ]
      };
      
      // Create chart if we have data
      if (chartData.labels.length > 0) {
        // Clear loading indicator
        chartContainer.innerHTML = '';
        
        // Set explicit height for chart container
        chartContainer.style.height = '400px';
        
        // Add date range title if filter is active
        if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
          const titleDiv = document.createElement('div');
          titleDiv.className = 'chart-date-range';
          titleDiv.textContent = `Duplications data from ${formatDate(sonarQubeDateFilterStart)} to ${formatDate(sonarQubeDateFilterEnd)}`;
          chartContainer.appendChild(titleDiv);
        }
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        // Create the chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems) {
                    const index = tooltipItems[0].dataIndex;
                    const item = sortedData[index];
                    return item.label;
                  },
                  label: function(context) {
                    const index = context.dataIndex;
                    const item = sortedData[index];
                    
                    if (context.dataset.label === 'Lines of Code') {
                      return `Lines of Code: ${context.parsed.y}`;
                    } else {
                      return `Duplicated Lines: ${context.parsed.y} (${item.duplicationDensity}%)`;
                    }
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.7)' }
              },
              y: {
                beginAtZero: true,
                max: yAxisMax, // Set to maximum lines with padding
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                  color: 'rgba(255, 255, 255, 0.7)',
                  precision: 0
                }
              }
            }
          }
        });
      } else {
        chartContainer.innerHTML = '<div class="chart-error">No duplication data available</div>';
      }
    } catch (error) {
      console.error('Error fetching SonarQube duplication data:', error);
      const chartContainer = document.getElementById('sonarqube-issues-chart');
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div class="chart-error">
            <p>Error loading duplication chart: ${error.message}</p>
            <p>The API might have restrictions for your project.</p>
          </div>
        `;
      }
    }
  }


  async function fetchCodeQualityData(baseUrl, projectKey) {
    try {
      const chartContainer = document.getElementById('sonarqube-quality-chart');
      if (!chartContainer) {
        console.error('Code quality chart container not found');
        return;
      }
    
      chartContainer.innerHTML = '<div class="loading">Fetching code quality data...</div>';
      
      // Using the measures history endpoint to get code quality metrics over time
      const historyApiUrl = `${baseUrl}/api/measures/search_history?component=${projectKey}&metrics=bugs,vulnerabilities,code_smells&ps=100`;
      
      console.log('Fetching code quality history from:', historyApiUrl);
      
      // Using the CORS proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(historyApiUrl)}`;
      console.log('Using proxy URL for code quality history:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Code quality history API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('SonarCloud code quality history data:', data);
      
      // Process the data for the chart
      const measures = data.measures || [];
      
      if (!measures.length) {
        chartContainer.innerHTML = '<div class="chart-error">No code quality history available</div>';
        return;
      }
      
      // Maps to store data by hour for each metric
      const hourlyMetrics = {
        bugs: Array(24).fill(0),
        vulnerabilities: Array(24).fill(0),
        code_smells: Array(24).fill(0)
      };
      
      // Count of data points per hour (for calculating averages later)
      const hourlyDataPoints = Array(24).fill(0);
      
      let hasDataInDateRange = false;
      
      // Handle case where only start date is provided (single day selection)
      let startDateCopy, endDateCopy;
      
      if (sonarQubeDateFilterStart && !sonarQubeDateFilterEnd) {
        // Create copies to avoid modifying original date objects
        startDateCopy = new Date(sonarQubeDateFilterStart);
        endDateCopy = new Date(sonarQubeDateFilterStart);
        endDateCopy.setHours(23, 59, 59, 999); // End of same day
      } else if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
        // Create copies when both dates are provided
        startDateCopy = new Date(sonarQubeDateFilterStart);
        endDateCopy = new Date(sonarQubeDateFilterEnd);
      }
      
      // Process all history points for each metric
      measures.forEach(measure => {
        const metricName = measure.metric;
        if (!hourlyMetrics[metricName] || !measure.history) return;
        
        measure.history.forEach(point => {
          const date = new Date(point.date);
          
          // Skip points outside date range if filter is active
          if (startDateCopy && endDateCopy) {
            // Compare dates at day level only
            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);
            startDateCopy.setHours(0, 0, 0, 0);
            endDateCopy.setHours(0, 0, 0, 0);
            
            if (compareDate < startDateCopy || compareDate > endDateCopy) {
              return; // Skip this point as it's outside the date range
            }
            
            hasDataInDateRange = true;
          }
          
          // Get the hour of the day (0-23)
          const hour = date.getHours();
          
          // Add the value to the corresponding hour's aggregate
          hourlyMetrics[metricName][hour] += parseFloat(point.value) || 0;
          
          // Increment the count of data points for this hour
          hourlyDataPoints[hour]++;
        });
      });
      
      // Show message if filtered data is empty
      if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd && !hasDataInDateRange) {
        chartContainer.innerHTML = '<div class="chart-error">No code quality data available in selected date range</div>';
        return;
      }
      
      // Format the hour labels (12am to 11pm)
      const hourLabels = Array(24).fill().map((_, i) => {
        const hour = i % 12 || 12; // Convert 0 to 12 for 12am
        const period = i < 12 ? 'am' : 'pm';
        return `${hour}${period}`;
      });
      
      // Create chart if we have data
      // Clear loading indicator
      chartContainer.innerHTML = '';
      
      // Set explicit height for chart container
      chartContainer.style.height = '400px';
      
      // Make the date range title more prominent - UPDATED FOR SINGLE DATE SELECTION
      if (sonarQubeDateFilterStart) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-date-range';
        
        // Format date display - handle both single date and range cases
        if (!sonarQubeDateFilterEnd || isSameDay(sonarQubeDateFilterStart, sonarQubeDateFilterEnd)) {
          titleDiv.textContent = `Code quality data from ${formatDate(sonarQubeDateFilterStart)}`;
        } else {
          titleDiv.textContent = `Code quality data from ${formatDate(sonarQubeDateFilterStart)} to ${formatDate(sonarQubeDateFilterEnd)}`;
        }
        
        titleDiv.style.fontSize = '1.1em';
        titleDiv.style.fontWeight = 'bold';
        titleDiv.style.padding = '8px';
        chartContainer.appendChild(titleDiv);
      }
      
      // Create div for ApexCharts
      const chartDiv = document.createElement('div');
      chartDiv.id = 'sonarqube-quality-apex-chart';
      chartDiv.style.width = '100%';
      chartDiv.style.height = '100%';
      chartContainer.appendChild(chartDiv);
      
      // Generate timestamp series for each hour
      const today = new Date();
      const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Prepare series data in the format ApexCharts expects
      const seriesData = [
        {
          name: 'Code Smells',
          data: hourlyMetrics.code_smells.map((value, index) => {
            const timestamp = new Date(baseDate);
            timestamp.setHours(index);
            return {
              x: timestamp.getTime(),
              y: Math.round(value)
            };
          })
        },
        {
          name: 'Bugs',
          data: hourlyMetrics.bugs.map((value, index) => {
            const timestamp = new Date(baseDate);
            timestamp.setHours(index);
            return {
              x: timestamp.getTime(),
              y: Math.round(value)
            };
          })
        },
        {
          name: 'Vulnerabilities',
          data: hourlyMetrics.vulnerabilities.map((value, index) => {
            const timestamp = new Date(baseDate);
            timestamp.setHours(index);
            return {
              x: timestamp.getTime(),
              y: Math.round(value)
            };
          })
        }
      ];
      
      // Define ApexCharts options
      const options = {
        series: seriesData,
        chart: {
          type: 'area',
          height: 350,
          toolbar: {
            show: false
          },
          background: 'transparent',
          fontFamily: 'inherit',
          // Add subtitle to show date context
          subtitle: {
            text: sonarQubeDateFilterStart ? 'Hourly breakdown of code quality issues' : 'All-time hourly breakdown of code quality issues',
            align: 'center',
            margin: 10,
            offsetX: 0,
            offsetY: 0,
            floating: false,
            style: {
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)'
            }
          }
        },
        colors: ['#e90bcb', '#ff6347', '#ffd700'], // Pink for code smells, Tomato for bugs, Gold for vulnerabilities
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.2,
            opacityTo: 0.1,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          type: 'datetime',
          categories: hourLabels,
          labels: {
            style: {
              colors: 'rgba(255, 255, 255, 0.7)'
            },
            formatter: function(value) {
              // Convert timestamp to hour format (12am, 1am, etc.)
              const date = new Date(value);
              const hour = date.getHours() % 12 || 12;
              const period = date.getHours() < 12 ? 'am' : 'pm';
              return `${hour}${period}`;
            }
          },
          axisBorder: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          axisTicks: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        yaxis: {
          min: 0,
          labels: {
            style: {
              colors: 'rgba(255, 255, 255, 0.7)'
            }
          }
        },
        tooltip: {
          shared: true,
          x: {
            formatter: function(value) {
              // Show the date and time in the tooltip
              const date = new Date(value);
              const hour = date.getHours() % 12 || 12;
              const period = date.getHours() < 12 ? 'am' : 'pm';
              
              if (sonarQubeDateFilterStart && sonarQubeDateFilterEnd) {
                // If date range is active, include the date in the tooltip
                const displayDate = isSameDay(sonarQubeDateFilterStart, sonarQubeDateFilterEnd) 
                  ? formatDate(sonarQubeDateFilterStart)
                  : `${formatDate(sonarQubeDateFilterStart)} - ${formatDate(sonarQubeDateFilterEnd)}`;
                return `${displayDate}, ${hour}${period}`;
              } else {
                return `${hour}${period}`;
              }
            }
          },
          y: {
            formatter: function(val) {
              return Math.round(val);
            }
          },
          theme: 'dark'
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          row: {
            colors: ['transparent', 'transparent'],
            opacity: 0.1
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          labels: {
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        }
      };
      
      // Create the ApexChart
      const chart = new ApexCharts(chartDiv, options);
      chart.render();
      
    } catch (error) {
      console.error('Error fetching SonarQube code quality data:', error);
      const chartContainer = document.getElementById('sonarqube-quality-chart');
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div class="chart-error">
            <p>Error loading code quality chart: ${error.message}</p>
          </div>
        `;
      }
    }
  }


  const issuesChartContainer = document.getElementById('sonarqube-issues-chart');
  if (issuesChartContainer) issuesChartContainer.innerHTML = '';
});


function isSameDay(date1, date2) {
  return date1.getDate() === date2.getDate() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
}