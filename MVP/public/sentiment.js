document.addEventListener('DOMContentLoaded', function() {
  // Get the commit results container
  const resultsDiv = document.getElementById('commitResults');
  const statusDiv = document.getElementById('sentiment-status');
  
  // Variables for pagination
  let currentPage = 1;
  let commitsPerPage = 5;
  let analyzedCommits = [];
  let allCommitsData = []; // Store all commits before filtering
  
  // Add date filter variables
  let dateFilterStart = null;
  let dateFilterEnd = null;
  
  // Initialize the contributor filter variable
  let selectedContributor = "all"; // Default to showing all contributors
  
  // Rate limiting constants
  const MAX_CONCURRENT_REQUESTS = 2; // Maximum concurrent requests
  const RETRY_DELAY_BASE = 1000;     // Start with 1 second retry delay
  const MAX_RETRIES = 3;             // Maximum number of retries per request


  let dateFilterDebounceTimer = null;
  
  // Add these event listeners right after creating the dateFilterDebounceTimer variable

  // Listen for dropdown changes to filter by contributor
  document.getElementById('mySelect').addEventListener('change', function() {
    const newContributor = this.value === "1" ? "all" : this.value;
    
    if (newContributor !== selectedContributor) {
      selectedContributor = newContributor;
      
      // Update the status to show filtering is happening
      statusDiv.innerHTML = '<p class="loading">Filtering commits by contributor...</p>';
      
      // Reset to first page when changing contributors
      currentPage = 1;
      filterAndAnalyzeCommits();
    }
  });

  // Listen for dropdown changes via custom event (for dropdown UI component)
  document.getElementById('mySelect').addEventListener('contributorChanged', function(event) {
    const newContributor = event.detail.value === "1" ? "all" : event.detail.value;
    
    if (newContributor !== selectedContributor) {
      selectedContributor = newContributor;
      
      // Update the status to show filtering is happening
      statusDiv.innerHTML = '<p class="loading">Filtering commits by contributor...</p>';
      
      // Reset pagination when changing contributors
      currentPage = 1;
      filterAndAnalyzeCommits();
    }
  });
  
  // Update the date range selection handler with debounce
  document.addEventListener('dateRangeSelected', function(event) {
    dateFilterStart = event.detail.start;
    dateFilterEnd = event.detail.end;
    
    // Update the status to show filtering is happening
    statusDiv.innerHTML = '<p class="loading">Filtering commits by selected date range...</p>';
    
    // Debounce to avoid multiple rapid calls
    if (dateFilterDebounceTimer) {
      clearTimeout(dateFilterDebounceTimer);
    }
    
    dateFilterDebounceTimer = setTimeout(() => {
      // Re-filter and analyze commits with the new date range
      filterAndAnalyzeCommits();
      dateFilterDebounceTimer = null;
    }, 500); // Wait 500ms before processing
  });
  
  // Also debounce the date selection reset
  document.addEventListener('dateSelectionReset', function(event) {
    dateFilterStart = null;
    dateFilterEnd = null;
    
    // Update the status to show resetting
    statusDiv.innerHTML = '<p class="loading">Resetting date filter, analyzing all commits...</p>';
    
    // Debounce to avoid multiple rapid calls
    if (dateFilterDebounceTimer) {
      clearTimeout(dateFilterDebounceTimer);
    }
    
    dateFilterDebounceTimer = setTimeout(() => {
      // Re-filter and analyze commits (all commits when filter is reset)
      filterAndAnalyzeCommits();
      dateFilterDebounceTimer = null;
    }, 500); // Wait 500ms before processing
  });
  
  // Function to filter commits by date range and analyze them
  function filterAndAnalyzeCommits() {
    // Reset to first page when changing filters
    currentPage = 1;
    
    // If we already have the raw commits data
    if (allCommitsData.length > 0) {
      // First filter by contributor if needed
      let filteredByContributor = allCommitsData;
      
      if (selectedContributor !== "all") {
        filteredByContributor = allCommitsData.filter(commit => 
          commit.author && 
          commit.author.login === selectedContributor
        );
        
        if (filteredByContributor.length === 0) {
          statusDiv.innerHTML = `<p class="chart-error">No commits found for selected contributor.</p>`;
          resultsDiv.innerHTML = '';
          return;
        }
      }
      
      // Then filter by date range if needed
      if (dateFilterStart && dateFilterEnd) {
        const filteredCommits = filteredByContributor.filter(commit => {
          const commitDate = new Date(commit.commit.author.date);
          return commitDate >= dateFilterStart && commitDate <= dateFilterEnd;
        });
        
        if (filteredCommits.length === 0) {
          let errorMessage = 'No commits found in the selected date range';
          if (selectedContributor !== "all") {
            errorMessage += ` for ${selectedContributor}`;
          }
          statusDiv.innerHTML = `<p class="chart-error">${errorMessage}.</p>`;
          resultsDiv.innerHTML = '';
          return;
        }
        
        // Process the filtered commits
        processAndAnalyzeCommits(filteredCommits);
      } else {
        // No date filter, process commits filtered by contributor
        processAndAnalyzeCommits(filteredByContributor);
      }
    } else {
      // Wait for commits to load first time
      checkCommitsAndAnalyze();
    }
  }
  
  // Add this function right after the filterAndAnalyzeCommits function
  function createSentimentChart(commits) {
    // Create chart container if it doesn't exist
    let chartContainer = document.getElementById('sentiment-chart-container');
    if (!chartContainer) {
      chartContainer = document.createElement('div');
      chartContainer.id = 'sentiment-chart-container';
      chartContainer.className = 'resultItem';
      chartContainer.innerHTML = `
        <h3>Sentiment Analysis Timeline</h3>
        <div style="height: 300px; position: relative;">
          <canvas id="sentimentChart"></canvas>
        </div>
      `;
    } else {
      // Clear existing chart
      chartContainer.querySelector('div').innerHTML = '<canvas id="sentimentChart"></canvas>';
    }
    
    // Group commits by hour and sentiment
    const hourlyData = Array(24).fill().map(() => ({
      positive: 0,
      neutral: 0,
      negative: 0
    }));
    
    commits.forEach(commit => {
      const hour = commit.date.getHours();
      if (commit.commitMessage.score > 0) {
        hourlyData[hour].positive++;
      } else if (commit.commitMessage.score < 0) {
        hourlyData[hour].negative++;
      } else {
        hourlyData[hour].neutral++;
      }
    });
    
    // Create hour labels (12am to 11pm)
    const hourLabels = Array(24).fill().map((_, i) => {
      if (i === 0) return '12am';
      if (i === 12) return '12pm';
      return i < 12 ? `${i}am` : `${i-12}pm`;
    });
    
    // Extract data for the chart
    const positiveData = hourlyData.map(hour => hour.positive);
    const neutralData = hourlyData.map(hour => hour.neutral);
    const negativeData = hourlyData.map(hour => hour.negative);
    
    // Return the container now - we'll create the chart after it's in the DOM
    return {
      container: chartContainer,
      createChart: function() {
        // Get the canvas context after the element is in the DOM
        const ctx = document.getElementById('sentimentChart').getContext('2d');
        
        return new Chart(ctx, {
          type: 'line',
          data: {
            labels: hourLabels,
            datasets: [
              {
                label: 'Positive Commits',
                data: positiveData,
                backgroundColor: 'rgba(51, 255, 140, 0.1)',
                borderColor: '#33ff8c',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#33ff8c',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false
              },
              {
                label: 'Neutral Commits',
                data: neutralData,
                backgroundColor: 'rgba(255, 183, 27, 0.1)',
                borderColor: '#ffb71b',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#ffb71b',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false
              },
              {
                label: 'Negative Commits',
                data: negativeData,
                backgroundColor: 'rgba(255, 99, 71, 0.1)',
                borderColor: '#ff6347',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#ff6347',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false
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
                  text: 'Number of Commits',
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
                  stepSize: 1,
                  beginAtZero: true
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#fff',
                  boxWidth: 12
                }
              },
              tooltip: {
                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                padding: 10
              }
            },
            interaction: {
              mode: 'index',
              intersect: false
            }
          }
        });
      }
    };
  }
  
  // Function to convert GitHub emoji shortcodes to actual emojis
  function convertGitHubEmoji(text) {
    // Common emoji mapping used in commit messages
    const emojiMap = {
      ':art:': '🎨', // Improve structure/format of the code
      ':zap:': '⚡️', // Improve performance
      ':fire:': '🔥', // Remove code or files
      ':bug:': '🐛', // Fix a bug
      ':ambulance:': '🚑️', // Critical hotfix
      ':sparkles:': '✨', // Introduce new features
      ':memo:': '📝', // Add or update documentation
      ':rocket:': '🚀', // Deploy stuff
      ':lipstick:': '💄', // Update UI and style files
      ':tada:': '🎉', // Begin a project
      ':white_check_mark:': '✅', // Add, update, or pass tests
      ':lock:': '🔒️', // Fix security issues
      ':closed_lock_with_key:': '🔐', // Add or update secrets
      ':bookmark:': '🔖', // Release / Version tags
      ':rotating_light:': '🚨', // Fix compiler / linter warnings
      ':construction:': '🚧', // Work in progress
      ':green_heart:': '💚', // Fix CI Build
      ':arrow_down:': '⬇️', // Downgrade dependencies
      ':arrow_up:': '⬆️', // Upgrade dependencies
      ':pushpin:': '📌', // Pin dependencies to specific versions
      ':construction_worker:': '👷', // Add or update CI build system
      ':chart_with_upwards_trend:': '📈', // Add or update analytics
      ':recycle:': '♻️', // Refactor code
      ':heavy_plus_sign:': '➕', // Add a dependency
      ':heavy_minus_sign:': '➖', // Remove a dependency
      ':wrench:': '🔧', // Add or update configuration files
      ':hammer:': '🔨', // Add or update build scripts
      ':globe_with_meridians:': '🌐', // Internationalization and localization
      ':pencil2:': '✏️', // Fix typos
      ':poop:': '💩', // Write bad code that needs to be improved
      ':rewind:': '⏪️', // Revert changes
      ':twisted_rightwards_arrows:': '🔀', // Merge branches
      ':package:': '📦️', // Add or update compiled files or packages
      ':alien:': '👽️', // Update code due to external API changes
      ':truck:': '🚚', // Move or rename resources (e.g.: files, paths, routes)
      ':page_facing_up:': '📄', // Add or update license
      ':boom:': '💥', // Introduce breaking changes
      ':bento:': '🍱', // Add or update assets
      ':wheelchair:': '♿️', // Improve accessibility
      ':bulb:': '💡', // Add or update comments in source code
      ':beers:': '🍻', // Write code drunkenly
      ':speech_balloon:': '💬', // Add or update text and literals
      ':card_file_box:': '🗃️', // Perform database related changes
      ':loud_sound:': '🔊', // Add or update logs
      ':mute:': '🔇', // Remove logs
      ':busts_in_silhouette:': '👥', // Add or update contributor(s)
      ':children_crossing:': '🚸', // Improve user experience / usability
      ':building_construction:': '🏗️', // Make architectural changes
      ':iphone:': '📱', // Work on responsive design
      ':clown_face:': '🤡', // Mock things
      ':egg:': '🥚', // Add or update an easter egg
      ':see_no_evil:': '🙈', // Add or update a .gitignore file
      ':camera_flash:': '📸', // Add or update snapshots
      ':alembic:': '⚗️', // Perform experiments
      ':mag:': '🔍️', // Improve SEO
      ':label:': '🏷️', // Add or update types
      ':seedling:': '🌱', // Add or update seed files
      ':triangular_flag_on_post:': '🚩', // Add, update, or remove feature flags
      ':goal_net:': '🥅', // Catch errors
      ':dizzy:': '💫', // Add or update animations and transitions
      ':wastebasket:': '🗑️', // Deprecate code that needs to be cleaned up
      ':passport_control:': '🛂', // Work on code related to authorization, roles and permissions
      ':adhesive_bandage:': '🩹', // Simple fix for a non-critical issue
      ':monocle_face:': '🧐', // Data exploration/inspection
      ':coffin:': '⚰️', // Remove dead code
      ':test_tube:': '🧪', // Add a failing test
      ':necktie:': '👔', // Add or update business logic
    };

    // Replace all emoji shortcodes with their corresponding emoji
    return text.replace(/:[a-z0-9_+-]+:/g, match => emojiMap[match] || match);
  }
  
  // Check if we have a repository URL available
  if (!window.repoUrl) {
    statusDiv.innerHTML = '<p class="chart-error">No repository URL found. Please connect a GitHub repository first.</p>';
    return;
  }

  // Update the URL extraction
  const match = window.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?/);
  if (!match) {
    statusDiv.innerHTML = '<p class="chart-error">Invalid GitHub repository URL format.</p>';
    return;
  }

  const owner = match[1];
  const repo = match[2];
  
  // Display initial loading status
  statusDiv.innerHTML = '<p class="loading">Waiting for commit data to load...</p>';
  
  // Function to check if commits are loaded and analyze them
  function checkCommitsAndAnalyze() {
    if (!window.allCommits || !window.allCommits.length) {
      // If commits not available yet, check again in a second
      setTimeout(checkCommitsAndAnalyze, 1000);
      return;
    }
    
    // Store the original commit data
    allCommitsData = window.allCommits;
    
    // Commits are available, update loading message
    statusDiv.innerHTML = '<p class="loading">Analyzing commit sentiments...</p>';
    
    // Filter and analyze commits
    filterAndAnalyzeCommits();
  }
  
  // Process and analyze filtered commits
  function processAndAnalyzeCommits(commits) {
    try {
      if (!commits.length) {
        statusDiv.innerHTML = '<p class="chart-error">No commits available after filtering. Please adjust your date range.</p>';
        resultsDiv.innerHTML = '';
        return;
      }
      
      console.log(`Found ${commits.length} commits to analyze${dateFilterStart ? ' in selected date range' : ''}`);
      
      // Process all commits - store basic info first
      analyzedCommits = commits.map(commit => {
        return {
          author: commit.commit.author.name,
          date: new Date(commit.commit.author.date),
          commitMessage: {
            message: commit.commit.message,
            score: 0 // Will be updated after Groq analysis
          },
          groqAnalysis: null // Will hold the Groq API response
        };
      });
      
      // Display "Analyzing with Groq..." status
      let statusMessage = 'Analyzing commit messages with Groq AI';
      if (dateFilterStart && dateFilterEnd) {
        const formatDate = (date) => {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
          });
        };
        statusMessage += ` (${formatDate(dateFilterStart)} to ${formatDate(dateFilterEnd)})`;
      }
      statusDiv.innerHTML = `<p class="loading">${statusMessage}...</p>`;
      
      // Analyze only the current page
      analyzeCommitsForPage(currentPage).then(() => {
        // Show first page results
        renderCommitsPage(currentPage);
      });
      
    } catch (error) {
      console.error('Error analyzing commits:', error);
      statusDiv.innerHTML = `
        <p class="chart-error">
          Error analyzing commits: ${error.message}
        </p>
      `;
    }
  }

  // Helper function to analyze commits for a specific page with rate limiting
  async function analyzeCommitsForPage(page) {
    const startIndex = (page - 1) * commitsPerPage;
    const endIndex = startIndex + commitsPerPage;
    const commitsToAnalyze = analyzedCommits.slice(startIndex, endIndex);
    
    // Update status to show we're analyzing
    statusDiv.innerHTML = `<p class="loading">Analyzing commits on page ${page}...</p>`;
    
    // Process each commit individually with rate limiting
    for (let i = 0; i < commitsToAnalyze.length; i++) {
      const commit = commitsToAnalyze[i];
      const commitIndex = startIndex + i;
      
      // Skip if already analyzed
      if (commit.groqAnalysis) continue;
      
      try {
        // Log the request for debugging
        console.log(`Sending Groq analysis request for commit: "${commit.commitMessage.message.substring(0, 30)}..."`);
        
        // Attempt to analyze with retries
        let retries = 0;
        let success = false;
        
        // Update the server API call to explicitly request classification into three categories
        while (!success && retries <= MAX_RETRIES) {
          try {
            const groqResponse = await fetch(`/groq/analyze`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ 
                messages: commit.commitMessage.message,
                categories: ["positive", "neutral", "negative"]  // Explicitly request these categories
              })
            });
            
            if (!groqResponse.ok) {
              const errorText = await groqResponse.text();
              console.log(`Groq API returned ${groqResponse.status}: ${errorText}`);
              
              // Check if it's a rate limit error
              const errorData = JSON.parse(errorText);
              if (groqResponse.status === 500 && 
                  errorData?.details?.error?.code === "rate_limit_exceeded") {
                
                // Extract wait time from error message, default to retry delay base * (retries + 1)
                let waitTime = RETRY_DELAY_BASE * Math.pow(2, retries);
                const waitMatch = errorData?.details?.error?.message.match(/try again in (\d+\.\d+)s/);
                if (waitMatch && waitMatch[1]) {
                  waitTime = Math.ceil(parseFloat(waitMatch[1]) * 1000) + 200; // Add 200ms buffer
                }
                
                // Update status with retry info
                statusDiv.innerHTML = `<p class="loading">Rate limited. Retrying in ${(waitTime/1000).toFixed(1)}s...</p>`;
                
                // Wait for the specified time before retrying
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retries++;
                continue; // Try again
              }
              
              throw new Error(`Groq API returned ${groqResponse.status}`);
            }
            
            const groqData = await groqResponse.json();
            console.log("Groq API response received:", groqData);
            
            // Store the Groq analysis in the commit object
            analyzedCommits[commitIndex].groqAnalysis = 
              groqData?.choices?.[0]?.message?.content || 
              "No analysis available.";
              
            // Set sentiment score based on Groq's analysis with better detection
            const analysis = analyzedCommits[commitIndex].groqAnalysis.toLowerCase();

            // First, check for explicit classifications with stronger patterns
            if (analysis.includes("classify") && analysis.includes("as")) {
              if (analysis.includes("as positive") || analysis.includes("as **positive**")) {
                analyzedCommits[commitIndex].commitMessage.score = 1;
              } else if (analysis.includes("as negative") || analysis.includes("as **negative**")) {
                analyzedCommits[commitIndex].commitMessage.score = -1;
              } else if (analysis.includes("as neutral") || analysis.includes("as **neutral**")) {
                analyzedCommits[commitIndex].commitMessage.score = 0;
              }
            } 
            // If no explicit classification found, fall back to keyword presence
            else {
              // Count occurrences to handle cases with multiple sentiment mentions
              const positiveCount = (analysis.match(/positive/g) || []).length;
              const negativeCount = (analysis.match(/negative/g) || []).length;
              const neutralCount = (analysis.match(/neutral/g) || []).length;
              
              // Determine sentiment based on which sentiment has the most mentions
              if (positiveCount > negativeCount && positiveCount > neutralCount) {
                analyzedCommits[commitIndex].commitMessage.score = 1;
              } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
                analyzedCommits[commitIndex].commitMessage.score = -1;
              } else if (neutralCount > 0) {
                // If neutral is mentioned at all and no other sentiment has more mentions
                analyzedCommits[commitIndex].commitMessage.score = 0;
              } else {
                // Default to neutral if unclear
                analyzedCommits[commitIndex].commitMessage.score = 0;
              }
            }
            
            success = true;
            
            // Add a small delay between successful requests to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (error) {
            console.error(`Error analyzing commit ${commitIndex}:`, error);
            retries++;
            
            if (retries > MAX_RETRIES) {
              analyzedCommits[commitIndex].groqAnalysis = "Error getting analysis: " + error.message;
              break;
            }
            
            // Exponential backoff
            const delay = RETRY_DELAY_BASE * Math.pow(2, retries - 1);
            console.log(`Retrying in ${delay}ms (attempt ${retries}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (error) {
        console.error(`Error analyzing commit ${commitIndex}:`, error);
        analyzedCommits[commitIndex].groqAnalysis = "Error getting analysis: " + error.message;
      }
    }
    
    // Clear status when done
    statusDiv.innerHTML = '';
    
    return commitsToAnalyze;
  }
  
  // Update the renderCommitsPage function to trigger analysis if needed

  function renderCommitsPage(page) {
    // Check if the commits on this page need to be analyzed
    const startIndex = (page - 1) * commitsPerPage;
    const endIndex = startIndex + commitsPerPage;
    const commitsToShow = analyzedCommits.slice(startIndex, endIndex);
    
    // Check if any commits on this page need analysis
    const needsAnalysis = commitsToShow.some(commit => !commit.groqAnalysis);
    
    if (needsAnalysis) {
      // Clear the top status message - we'll show it at the bottom instead
      statusDiv.innerHTML = '';
      
      // Render the page content first
      renderPageContent(page, true); // Pass true to indicate we're analyzing
      
      // Analyze this page
      analyzeCommitsForPage(page).then(() => {
        // Update the display after analysis is complete
        // Re-render without the loading indicator
        renderPageContent(page, false);
      }).catch(error => {
        console.error('Error analyzing page:', error);
        // Show error at the bottom of the page
        const paginationLoading = document.getElementById('pagination-loading');
        if (paginationLoading) {
          paginationLoading.innerHTML = `<p class="chart-error">Error analyzing commits: ${error.message}</p>`;
        }
      });
    } else {
      // No analysis needed, just render the page
      statusDiv.innerHTML = '';
      renderPageContent(page, false);
    }
  }
  
  // Extract the page rendering logic into a separate function
  // Update the renderPageContent function to move the date filter info above the summary

  // Update the renderPageContent function to show contributor information

function renderPageContent(page, isAnalyzing = false) {
  // Clear results div
  resultsDiv.innerHTML = '';
  
  // Add date filter information ABOVE the summary if active
  if (dateFilterStart && dateFilterEnd) {
    const formatDate = (date) => {
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };
    
    const dateFilterDiv = document.createElement('div');
    dateFilterDiv.className = 'date-filter-info';
    
    // Include contributor info in the filter description if applicable
    let filterText = `Filtered by date: ${formatDate(dateFilterStart)} to ${formatDate(dateFilterEnd)}`;
    if (selectedContributor !== "all") {
      // Get contributor display name from dropdown
      let contributorName = selectedContributor;
      const dropdown = document.getElementById('mySelect');
      if (dropdown) {
        const option = Array.from(dropdown.options).find(opt => opt.value === selectedContributor);
        if (option) {
          contributorName = option.textContent;
        }
      }
      
      filterText += ` for contributor: ${contributorName}`;
    }
    
    dateFilterDiv.innerHTML = filterText;
    resultsDiv.appendChild(dateFilterDiv);
  } 
  // Show contributor-only filter if only contributor is selected
  else if (selectedContributor !== "all") {
    // Get contributor display name from dropdown
    let contributorName = selectedContributor;
    const dropdown = document.getElementById('mySelect');
    if (dropdown) {
      const option = Array.from(dropdown.options).find(opt => opt.value === selectedContributor);
      if (option) {
        contributorName = option.textContent;
      }
    }
    
    const contributorFilterDiv = document.createElement('div');
    contributorFilterDiv.className = 'date-filter-info';
    contributorFilterDiv.innerHTML = `Showing commits for: ${contributorName}`;
    resultsDiv.appendChild(contributorFilterDiv);
  }
  
  // Calculate the slice of commits to show on this page
  const startIndex = (page - 1) * commitsPerPage;
  const endIndex = startIndex + commitsPerPage;
  const commitsToShow = analyzedCommits.slice(startIndex, endIndex);
  
  // Calculate total pages
  const totalPages = Math.ceil(analyzedCommits.length / commitsPerPage);
  
  // Updated: Display summary statistics for all commits with three categories
  const allPositiveCommits = analyzedCommits.filter(commit => commit.commitMessage.score > 0).length;
  const allNeutralCommits = analyzedCommits.filter(commit => commit.commitMessage.score === 0).length;
  const allNegativeCommits = analyzedCommits.filter(commit => commit.commitMessage.score < 0).length;
  
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'sentiment-summary resultItem';
  
  // Updated summary HTML with neutral commits
  const summaryHTML = `
    <h3>Commit Analysis Summary</h3>
    <p>
      <span class="positive">${allPositiveCommits}</span> positive commits | 
      <span class="neutral">${allNeutralCommits}</span> neutral commits | 
      <span class="negative">${allNegativeCommits}</span> negative commits
    </p>
    <p>Page ${page} of ${totalPages} (${analyzedCommits.length} total commits)</p>
  `;
  
  summaryDiv.innerHTML = summaryHTML;
  resultsDiv.appendChild(summaryDiv);
  
  // Add the sentiment chart below the summary - UPDATED APPROACH
  const chartData = createSentimentChart(analyzedCommits);
  resultsDiv.appendChild(chartData.container);
  
  // Create the chart after the container is in the DOM
  setTimeout(() => {
    chartData.createChart();
  }, 0);
  
  // Rest of the render function (displaying commits, pagination) remains the same
  
  // Display each commit with its sentiment and basic analysis
  commitsToShow.forEach((commit, index) => {
    const commitElement = document.createElement('div');
    commitElement.classList.add('resultItem');
    
    const date = commit.date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Updated to handle neutral sentiment
    let sentimentClass = 'neutral';
    let sentimentText = 'Neutral';
    
    if (commit.commitMessage.score > 0) {
      sentimentClass = 'positive';
      sentimentText = 'Positive';
    } else if (commit.commitMessage.score < 0) {
      sentimentClass = 'negative';
      sentimentText = 'Negative';
    }
    
    commitElement.innerHTML = `
      <h3>${escapeHtml(commit.author)} on ${date}</h3>
      <p>
        <strong>Message:</strong> 
        ${convertGitHubEmoji(escapeHtml(commit.commitMessage.message))}
        <span class="${sentimentClass}">(${sentimentText})</span>
      </p>
      <div class="groq-analysis">
        <p><strong>Groq Analysis:</strong></p>
        <p>${commit.groqAnalysis || 'Analyzing...'}</p>
      </div>
    `;
    
    resultsDiv.appendChild(commitElement);
  });
  
  // Add loading indicator above pagination if we're analyzing
  if (isAnalyzing) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'pagination-loading';
    loadingDiv.className = 'loading';
    loadingDiv.style.marginTop = '20px'; // Add some spacing
    loadingDiv.innerHTML = '<p>Analyzing commits on page ' + page + '...</p>';
    resultsDiv.appendChild(loadingDiv);
  }
  
  // Add pagination controls if we have more than one page
  if (totalPages > 1) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    
    // Previous page button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn';
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = page === 1;
    prevButton.addEventListener('click', () => renderCommitsPage(page - 1));
    paginationDiv.appendChild(prevButton);
    
    // Calculate which page numbers to show (show max 5 page numbers + first/last if needed)
    let pageNumbers = [];
    if (totalPages <= 7) {
      // If 7 or fewer pages, show all page numbers
      pageNumbers = Array.from({length: totalPages}, (_, i) => i + 1);
    } else {
      // Always include page 1
      pageNumbers.push(1);
      
      // For current pages near the beginning
      if (page < 5) {
        pageNumbers.push(2, 3, 4, 5);
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      }
      // For current pages near the end
      else if (page > totalPages - 4) {
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      }
      // For current pages in the middle
      else {
        pageNumbers.push('ellipsis');
        pageNumbers.push(page - 1, page, page + 1);
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      }
    }
    
    // Create page number buttons, ensuring no duplicates
    const uniquePageNumbers = [...new Set(pageNumbers)];
    uniquePageNumbers.forEach(num => {
      if (num === 'ellipsis') {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationDiv.appendChild(ellipsis);
      } else {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        if (num === page) pageBtn.classList.add('active');
        pageBtn.textContent = num;
        pageBtn.addEventListener('click', () => renderCommitsPage(num));
        paginationDiv.appendChild(pageBtn);
      }
    });
    
    // Next page button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn';
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = page === totalPages;
    nextButton.addEventListener('click', () => renderCommitsPage(page + 1));
    paginationDiv.appendChild(nextButton);
    
    resultsDiv.appendChild(paginationDiv);
  }
  
  // Update the current page
  currentPage = page;
}
  
  // Start polling for commits
  checkCommitsAndAnalyze();
  
  // Helper function to escape HTML to prevent XSS
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")  // Fix: removed extra slash
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});