document.addEventListener('DOMContentLoaded', function() {
    // Weather container elements
    const weatherContainer = document.querySelector('.weather-container');
    const weatherHeader = document.querySelector('.weather-header');
    
    // Create elements for weather content
    const contentDiv = document.createElement('div');
    contentDiv.id = 'weather-content';
    contentDiv.className = 'weather-content';
    
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'weather-placeholder';
    placeholderDiv.innerHTML = `
        <div class="weather-icon-large">
            <i class="weather-icon">🗓️</i>
        </div>
        <p>Select a date on the calendar to view historical weather data</p>
    `;
    
    const weatherDataDiv = document.createElement('div');
    weatherDataDiv.className = 'weather-data';
    weatherDataDiv.style.display = 'none';
    
    // Create canvas for the chart
    const chartCanvas = document.createElement('canvas');
    chartCanvas.id = 'weatherTemperatureChart';
    weatherDataDiv.appendChild(chartCanvas);
    
    contentDiv.appendChild(placeholderDiv);
    contentDiv.appendChild(weatherDataDiv);
    
    // Append elements to the weather container
    weatherContainer.appendChild(contentDiv);
    
    // Weather chart instance holder
    let weatherChart = null;
    
    // Create a date formatting function
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    function getWeatherDescription(conditionCode) {
        // Mapping Meteostat condition codes to descriptions and emojis
        // Based on https://dev.meteostat.net/formats.html#condition-codes
        const conditionMap = {
            1: { description: 'Clear', emoji: '☀️' },
            2: { description: 'Fair', emoji: '🌤️' },
            3: { description: 'Cloudy', emoji: '☁️' },
            4: { description: 'Overcast', emoji: '🌥️' },
            5: { description: 'Fog', emoji: '🌫️' },
            6: { description: 'Freezing Fog', emoji: '❄️🌫️' },
            7: { description: 'Light Rain', emoji: '🌦️' },
            8: { description: 'Rain', emoji: '🌧️' },
            9: { description: 'Heavy Rain', emoji: '⛈️' },
            10: { description: 'Freezing Rain', emoji: '❄️🌧️' },
            11: { description: 'Heavy Freezing Rain', emoji: '❄️⛈️' },
            12: { description: 'Sleet', emoji: '🌨️' },
            13: { description: 'Heavy Sleet', emoji: '🌨️' },
            14: { description: 'Light Snowfall', emoji: '🌨️' },
            15: { description: 'Snowfall', emoji: '❄️' },
            16: { description: 'Heavy Snowfall', emoji: '❄️❄️' },
            17: { description: 'Rain Shower', emoji: '🌦️' },
            18: { description: 'Heavy Rain Shower', emoji: '⛈️' },
            19: { description: 'Sleet Shower', emoji: '🌨️' },
            20: { description: 'Heavy Sleet Shower', emoji: '🌨️' },
            21: { description: 'Snow Shower', emoji: '🌨️' },
            22: { description: 'Heavy Snow Shower', emoji: '❄️❄️' },
            23: { description: 'Lightning', emoji: '⚡' },
            24: { description: 'Hail', emoji: '🌨️' },
            25: { description: 'Thunderstorm', emoji: '🌩️' },
            26: { description: 'Heavy Thunderstorm', emoji: '⛈️' },
            27: { description: 'Storm', emoji: '🌪️' }
        };

        return conditionCode && conditionMap[conditionCode] ? 
            `${conditionMap[conditionCode].emoji} ${conditionMap[conditionCode].description}` : 
            'Unknown weather condition';
    }
    
    // Function to fetch weather data for a specific date (hourly)
    async function fetchWeatherData(date) {
        try {
            weatherDataDiv.innerHTML = '<div class="weather-loading">Loading weather data...</div>';
            weatherDataDiv.style.display = 'block';
            placeholderDiv.style.display = 'none';

            // Update header with selected date
            const headerDateElem = document.getElementById('weather-date') || document.createElement('p');
            headerDateElem.id = 'weather-date';
            headerDateElem.textContent = formatDayMonthYear(date);
            if (!document.getElementById('weather-date')) {
                weatherHeader.appendChild(headerDateElem);
            }

            // Get station
            const station = await getDefaultStation();
            const formattedDate = formatDate(date);

            // Fetch hourly data from Meteostat via server
            const response = await fetch(`/weather/station/hourly?date=${formattedDate}&station=${station.id}`);
            if (!response.ok) {
                throw new Error(`Weather API returned ${response.status}`);
            }
            const weatherData = await response.json();

            // Display hourly weather data as a chart
            displaySingleDayChart(weatherData, date);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            weatherDataDiv.innerHTML = `
                <div class="weather-error">
                    <p>Sorry, we couldn't fetch weather data for this date.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    }
    
    // Function to display single day weather data chart
    function displaySingleDayChart(data, date) {
        // Clear existing chart container first
        weatherDataDiv.innerHTML = '';
        const chartCanvas = document.createElement('canvas');
        chartCanvas.id = 'weatherTemperatureChart';
        weatherDataDiv.appendChild(chartCanvas);
        
        if (!data || !data.data || data.data.length === 0) {
            weatherDataDiv.innerHTML = `
                <div class="weather-error">
                    <p>No weather data available for ${date.toLocaleDateString()}</p>
                </div>
            `;
            return;
        }

        // Sort data by hour to ensure correct order
        const hours = data.data.sort((a, b) => {
            return new Date(a.time).getHours() - new Date(b.time).getHours();
        });
        
        // Extract data for the chart
        const labels = hours.map(item => {
            const hour = new Date(item.time).getHours();
            return hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`;
        });
        
        const temperatures = hours.map(item => item.temp);
        
        // Prepare additional data for tooltips
        const tooltipData = hours.map(item => ({
            temperature: item.temp !== null ? item.temp.toFixed(1) + '°C' : 'N/A',
            humidity: item.rhum !== null ? item.rhum + '%' : 'N/A',
            pressure: item.pres !== null ? item.pres + ' hPa' : 'N/A',
            wind: item.wspd !== null ? item.wspd + ' km/h' : 'N/A',
            weatherCondition: item.coco !== undefined ? getWeatherDescription(item.coco) : 'Unknown weather'
        }));
        
        // Destroy existing chart if it exists
        if (weatherChart) {
            weatherChart.destroy();
        }
        
        // Get the canvas context
        const ctx = document.getElementById('weatherTemperatureChart').getContext('2d');
        
        // Create the chart
        weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatures,
                    fill: false,
                    backgroundColor: 'rgba(198, 13, 223, 0.91)',
                    borderColor: 'rgba(198, 13, 223, 0.91)',
                    borderWidth: 2,
                    tension: 0.5,
                    pointBackgroundColor: 'rgba(198, 13, 223, 0.91)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
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
                            maxTicksLimit: 12
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
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
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                const data = tooltipData[dataIndex];
                                
                                return [
                                    `Temperature: ${data.temperature}`,
                                    `Weather: ${data.weatherCondition}`,
                                    `Humidity: ${data.humidity}`,
                                    `Pressure: ${data.pressure}`,
                                    `Wind: ${data.wind}`
                                ];
                            }
                        },
                        backgroundColor: 'rgba(30, 30, 30, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                }
            }
        });
    }

    // Function to get the default station (London Weather Station: 03772)
    async function getDefaultStation() {
        return {
            id: '03772', // London Weather Station (city center)
            name: 'London Weather Station'
        };
    }
    
    // Helper function for day/month/year format
    function formatDayMonthYear(date) {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    // Update the weather header date display for a range
    function updateWeatherHeaderDate(start, end) {
        let headerDateElem = document.getElementById('weather-date');
        if (!headerDateElem) {
            headerDateElem = document.createElement('p');
            headerDateElem.id = 'weather-date';
            weatherHeader.appendChild(headerDateElem);
        }
        if (start && end) {
            headerDateElem.textContent = `${formatDayMonthYear(start)} - ${formatDayMonthYear(end)}`;
        } else if (start) {
            headerDateElem.textContent = formatDayMonthYear(start);
        } else {
            headerDateElem.textContent = '';
        }
    }

    // Helper to get all commit dates as YYYY-MM-DD strings
    function getCommitDateStringsInRange(start, end) {
        if (!window.allCommits) return [];
        const commitDates = window.allCommits.map(commit => {
            const d = new Date(commit.commit.author.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        });
        const uniqueCommitDates = Array.from(new Set(commitDates));
        const result = [];
        let current = new Date(start);
        current.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(0, 0, 0, 0);
        while (current <= endDate) {
            if (uniqueCommitDates.includes(current.getTime())) {
                result.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
        return result;
    }

    // Function to fetch and display multiple weather charts for commit days in range
    async function fetchAndDisplayWeatherForCommitDays(start, end) {
        // Clear previous charts
        weatherDataDiv.innerHTML = '';
        weatherDataDiv.style.display = 'block';
        placeholderDiv.style.display = 'none';

        // Get all commit days in range
        const commitDays = getCommitDateStringsInRange(start, end);
        if (commitDays.length === 0) {
            weatherDataDiv.innerHTML = `
                <div class="weather-error">
                    <p>No commits were made on any day in the selected range.</p>
                </div>
            `;
            return;
        }

        // For each commit day, fetch and display weather chart
        for (const date of commitDays) {
            // Create a container for each chart
            const chartSection = document.createElement('div');
            chartSection.className = 'weather-chart-section';
            // Date label
            const dateLabel = document.createElement('p');
            dateLabel.id = 'weather-date';
            dateLabel.textContent = formatDayMonthYear(date);
            chartSection.appendChild(dateLabel);

            // Chart canvas
            const chartCanvas = document.createElement('canvas');
            chartCanvas.className = 'weatherTemperatureChart';
            chartCanvas.style.marginBottom = '30px';
            chartSection.appendChild(chartCanvas);

            // Add a loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'weather-loading';
            loadingDiv.textContent = 'Loading weather data...';
            chartSection.appendChild(loadingDiv);

            weatherDataDiv.appendChild(chartSection);

            // Fetch weather data for this date
            try {
                const station = await getDefaultStation();
                const formattedDate = formatDate(date);
                const response = await fetch(`/weather/station/hourly?date=${formattedDate}&station=${station.id}`);
                if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
                const weatherData = await response.json();

                // Remove loading indicator
                chartSection.removeChild(loadingDiv);

                // If no data, show error
                if (!weatherData || !weatherData.data || weatherData.data.length === 0) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'weather-error';
                    errorDiv.innerHTML = `<p>No weather data available for ${formatDayMonthYear(date)}</p>`;
                    chartSection.appendChild(errorDiv);
                    continue;
                }

                // Prepare chart data
                const hours = weatherData.data.sort((a, b) => new Date(a.time).getHours() - new Date(b.time).getHours());
                const labels = hours.map(item => {
                    const hour = new Date(item.time).getHours();
                    return hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`;
                });
                const temperatures = hours.map(item => item.temp);
                const tooltipData = hours.map(item => ({
                    temperature: item.temp !== null ? item.temp.toFixed(1) + '°C' : 'N/A',
                    humidity: item.rhum !== null ? item.rhum + '%' : 'N/A',
                    pressure: item.pres !== null ? item.pres + ' hPa' : 'N/A',
                    wind: item.wspd !== null ? item.wspd + ' km/h' : 'N/A',
                    weatherCondition: item.coco !== undefined ? getWeatherDescription(item.coco) : 'Unknown weather'
                }));

                // Draw chart
                const ctx = chartCanvas.getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Temperature (°C)',
                            data: temperatures,
                            fill: false,
                            backgroundColor: 'rgba(198, 13, 223, 0.91)',
                            borderColor: 'rgba(198, 13, 223, 0.91)',
                            borderWidth: 2,
                            tension: 0.5,
                            pointBackgroundColor: 'rgba(198, 13, 223, 0.91)',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
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
                                    maxTicksLimit: 12
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Temperature (°C)',
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
                        plugins: {
                            legend: { display: false },
                            title: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const dataIndex = context.dataIndex;
                                        const data = tooltipData[dataIndex];
                                        return [
                                            `Temperature: ${data.temperature}`,
                                            `Weather: ${data.weatherCondition}`,
                                            `Humidity: ${data.humidity}`,
                                            `Pressure: ${data.pressure}`,
                                            `Wind: ${data.wind}`
                                        ];
                                    }
                                },
                                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: false
                            }
                        }
                    }
                });
            } catch (error) {
                // Remove loading indicator and show error
                chartSection.removeChild(loadingDiv);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'weather-error';
                errorDiv.innerHTML = `<p>Sorry, we couldn't fetch weather data for ${formatDayMonthYear(date)}.</p>
                                      <p class="error-details">${error.message}</p>`;
                chartSection.appendChild(errorDiv);
            }
        }
    }

    // Listen for date selection events from the calendar
    document.addEventListener('dateRangeSelected', function(event) {
        const { start, end } = event.detail;
        if (start && end) {
            updateWeatherHeaderDate(start, end);
            fetchAndDisplayWeatherForCommitDays(start, end);
        } else if (start) {
            updateWeatherHeaderDate(start, null);
            fetchWeatherData(start);
        }
    });
    
    // Listen for date reset events
    document.addEventListener('dateSelectionReset', function() {
        // Reset weather display
        placeholderDiv.style.display = 'block';
        weatherDataDiv.style.display = 'none';
        
        // Remove date display if it exists
        const dateDisplay = document.getElementById('weather-date');
        if (dateDisplay) {
            dateDisplay.remove();
        }
        
        // Destroy chart if it exists
        if (weatherChart) {
            weatherChart.destroy();
            weatherChart = null;
        }

        updateWeatherHeaderDate(null, null);
    });
});