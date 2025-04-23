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
            headerDateElem.textContent = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
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

    // Function to fetch weather data for a date range
    async function fetchWeatherRangeData(startDate, endDate) {
        try {
            // Show loading state
            weatherDataDiv.innerHTML = '<div class="weather-loading">Loading weather summary...</div>';
            weatherDataDiv.style.display = 'block';
            placeholderDiv.style.display = 'none';
            
            // Update header with date range
            const headerDateElem = document.getElementById('weather-date') || document.createElement('p');
            headerDateElem.id = 'weather-date';
            headerDateElem.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
            
            if (!document.getElementById('weather-date')) {
                weatherHeader.appendChild(headerDateElem);
            }
            
            // Get station
            const station = await getDefaultStation();
            
            // Format dates for API
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);
            
            // Fetch daily data for the entire range first
            const dailyResponse = await fetch(`/weather/station/range?start=${formattedStartDate}&end=${formattedEndDate}&station=${station.id}`);
            
            if (!dailyResponse.ok) {
                throw new Error(`Weather API returned ${dailyResponse.status}`);
            }
            
            const dailyData = await dailyResponse.json();
            
            // We'll also need hourly data for each day to use in tooltips
            // Fetch hourly data for each day in the range
            const hourlyDataByDate = {};
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const formattedDate = formatDate(currentDate);
                const hourlyResponse = await fetch(`/weather/station/hourly?date=${formattedDate}&station=${station.id}`);
                
                if (hourlyResponse.ok) {
                    const hourlyData = await hourlyResponse.json();
                    if (hourlyData.data && hourlyData.data.length > 0) {
                        hourlyDataByDate[formattedDate] = hourlyData.data;
                    }
                }
                
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Display the multi-day chart
            displayMultiDayChart(dailyData, hourlyDataByDate, startDate, endDate);
            
        } catch (error) {
            console.error('Error fetching weather range data:', error);
            weatherDataDiv.innerHTML = `
                <div class="weather-error">
                    <p>Sorry, we couldn't fetch weather data for this date range.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    }
    
    // Function to display weather data for multiple days with hourly tooltips
    function displayMultiDayChart(dailyData, hourlyDataByDate, startDate, endDate) {
        // Clear existing chart container first
        weatherDataDiv.innerHTML = '';
        const chartCanvas = document.createElement('canvas');
        chartCanvas.id = 'weatherTemperatureChart';
        weatherDataDiv.appendChild(chartCanvas);
        
        if (!dailyData || !dailyData.data || dailyData.data.length === 0) {
            weatherDataDiv.innerHTML = `
                <div class="weather-error">
                    <p>No weather data available for the selected date range</p>
                </div>
            `;
            return;
        }
        
        // Sort data by date
        const sortedData = dailyData.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Create date labels
        const dateLabels = sortedData.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        // Get temperature data
        const avgTemps = sortedData.map(day => day.tavg);
        const minTemps = sortedData.map(day => day.tmin);
        const maxTemps = sortedData.map(day => day.tmax);
        
        // Store hourly data for tooltips
        const tooltipHourlyData = {};
        
        // Process hourly data for tooltips
        Object.keys(hourlyDataByDate).forEach(date => {
            const hourlyData = hourlyDataByDate[date];
            
            // Transform hourly data to be accessible by hour
            const hourlyByHour = {};
            hourlyData.forEach(hourData => {
                const hour = new Date(hourData.time).getHours();
                
                hourlyByHour[hour] = {
                    temperature: hourData.temp !== null ? hourData.temp.toFixed(1) + '°C' : 'N/A',
                    humidity: hourData.rhum !== null ? hourData.rhum + '%' : 'N/A',
                    pressure: hourData.pres !== null ? hourData.pres + ' hPa' : 'N/A',
                    wind: hourData.wspd !== null ? hourData.wspd + ' km/h' : 'N/A',
                    weatherCode: hourData.coco !== undefined ? `Weather Code: ${hourData.coco}` : 'N/A'
                };
            });
            
            tooltipHourlyData[date] = hourlyByHour;
        });
        
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
                labels: dateLabels,
                datasets: [
                    {
                        label: 'Avg Temperature',
                        data: avgTemps,
                        fill: false,
                        backgroundColor: 'rgba(198, 13, 223, 0.91)',
                        borderColor: 'rgba(198, 13, 223, 0.91)',
                        borderWidth: 2.5,
                        tension: 0.5,
                        pointBackgroundColor: 'rgba(198, 13, 223, 0.91)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Min Temperature',
                        data: minTemps,
                        fill: false,
                        backgroundColor: 'rgba(51, 153, 255, 0.91)',
                        borderColor: 'rgba(51, 153, 255, 0.91)',
                        borderWidth: 1.5,
                        borderDash: [5, 5],
                        tension: 0.5,
                        pointBackgroundColor: 'rgba(51, 153, 255, 0.91)',
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Max Temperature',
                        data: maxTemps,
                        fill: false,
                        backgroundColor: 'rgba(255, 99, 71, 0.91)',
                        borderColor: 'rgba(255, 99, 71, 0.91)',
                        borderWidth: 1.5,
                        borderDash: [5, 5],
                        tension: 0.5,
                        pointBackgroundColor: 'rgba(255, 99, 71, 0.91)',
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
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
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#fff'
                        }
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            afterTitle: function(context) {
                                const dataIndex = context[0].dataIndex;
                                const date = sortedData[dataIndex].date;
                                
                                if (tooltipHourlyData[date]) {
                                    return "Hover for hourly details";
                                }
                                return "";
                            },
                            label: function(context) {
                                const datasetLabel = context.dataset.label;
                                const value = context.parsed.y;
                                
                                if (value !== null) {
                                    return `${datasetLabel}: ${value.toFixed(1)}°C`;
                                }
                                return `${datasetLabel}: N/A`;
                            },
                            afterLabel: function(context) {
                                const dataIndex = context.dataIndex;
                                const date = sortedData[dataIndex].date;
                                
                                if (tooltipHourlyData[date]) {
                                    const morning = tooltipHourlyData[date][8] || tooltipHourlyData[date][9];
                                    const noon = tooltipHourlyData[date][12] || tooltipHourlyData[date][13];
                                    const evening = tooltipHourlyData[date][18] || tooltipHourlyData[date][19];
                                    
                                    const lines = [];
                                    
                                    if (morning) {
                                        lines.push(`Morning (8AM): ${morning.temperature}`);
                                    }
                                    
                                    if (noon) {
                                        lines.push(`Noon (12PM): ${noon.temperature}`);
                                    }
                                    
                                    if (evening) {
                                        lines.push(`Evening (6PM): ${evening.temperature}`);
                                    }
                                    
                                    return lines;
                                }
                                
                                return [];
                            }
                        },
                        backgroundColor: 'rgba(30, 30, 30, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
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
    
    // Listen for date selection events from the calendar
    document.addEventListener('dateRangeSelected', function(event) {
        const { start, end } = event.detail;
        
        if (start && end) {
            fetchWeatherRangeData(start, end);
        } else if (start) {
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
    });
});