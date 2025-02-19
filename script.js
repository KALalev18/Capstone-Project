/*
TO DO 
Add the branch section https://api.github.com/repos/{owner}/{repo}/branches ---- DONE
Add the AI analysis ---- DONE
Cyclomatic Complexity 
 - https://github.com/gcattan/git-quality-check?tab=readme-ov-file 
 - https://github.com/lavelle96/cyclomatic-complexity 
 - https://github.com/stefano-lupo/Cyclomatic-Complexity-Server

Bug Rate Tracking ---- DONE
Peak Coding Hours Tracker ---- DONE
*/


function handleSubmit(event) {
    const url = new URL(form.action);
    const formData = new FormData(form);

    /** @type {Parameters<fetch>[1]} */
    const fetchOptions = {
        method: form.method,
        body: formData,
    };

    fetch(url, fetchOptions);

    event.preventDefault();
}

function clearBox(elementClass) {
    const element = document.querySelector(`.${elementClass}`);
    if (element) element.innerHTML = "";
}

// Displays the commits 

function fetchData() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.main-commits-container');

                data.forEach(commit => {
                    const commitDiv = document.createElement('div');
                    commitDiv.className = 'chart';

                    const shaP = document.createElement('p');
                    shaP.textContent = `Commit SHA: ${commit.sha}`;

                    const authorP = document.createElement('p');
                    authorP.textContent = `Author: ${commit.commit.author.name}`;

                    const messageP = document.createElement('p');
                    messageP.textContent = `Message: ${commit.commit.message}`;

                    commitDiv.appendChild(shaP);
                    commitDiv.appendChild(authorP);
                    commitDiv.appendChild(messageP);

                    mainDiv.appendChild(commitDiv);
                });
            })
            .catch(error => console.error(error));
    } else {
        console.error('Invalid GitHub URL');
    }
}

// Chart

function createChart() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value.trim();
    clearBox('main-commits-container');
    if (!url) {
        console.error('Please enter a GitHub repository URL.');
        return;
    }

    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub URL. Please use the format: https://github.com/username/repository');
        return;
    }

    const username = match[1];
    const repository = match[2];

    const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits`;
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const commitData = {};
            data.forEach(commit => {
                const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
                commitData[date] = (commitData[date] || 0) + 1;
            });

            const dates = Object.keys(commitData).sort((a, b) => new Date(a) - new Date(b));
            if (dates.length === 0) {
                console.error('No commit data found.');
                return;
            }

            const startDate = new Date(dates[0]);
            const endDate = new Date(dates[dates.length - 1]);
            const fullCommitData = {};

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                fullCommitData[dateStr] = commitData[dateStr] || 0;
            }

            const chartData = Object.keys(fullCommitData).map(date => ({
                date,
                commits: fullCommitData[date]
            }));
            let canvas = document.getElementById('chart-line');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'chart-line';
                document.querySelector('.main-commits-container').appendChild(canvas);
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Could not get 2D context for the canvas.');
                return;
            }

            if (window.myChart) {
                window.myChart.destroy();
            }

            window.myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.map(commit => commit.date),
                    datasets: [{
                        label: 'Commits per day',
                        data: chartData.map(commit => commit.commits),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: 'category',
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching or processing data:', error);
        });
}


// Contributors

function getContributors() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/contributors`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.main-commits-container');

                data.forEach(contributor => {
                    const contributorDiv = document.createElement('div');
                    contributorDiv.className = 'chart';

                    const nameP = document.createElement('p');
                    nameP.textContent = `Name: ${contributor.login}`;

                    const contributionsP = document.createElement('p');
                    contributionsP.textContent = `Contributions: ${contributor.contributions}`;

                    contributorDiv.appendChild(nameP);
                    contributorDiv.appendChild(contributionsP);

                    mainDiv.appendChild(contributorDiv);
                });
            })
            .catch(error => console.error(error));
    } else {
        console.error('Invalid GitHub URL');
    }
}

function getInsights() {
    const mainDiv = document.querySelector('.main-commits-container');
    clearBox('main-commits-container');

    const contributorDiv = document.createElement('div');
    const disclaimer = document.createElement('h1');
    disclaimer.textContent = "No AI insights for now";

    contributorDiv.appendChild(disclaimer);
    mainDiv.appendChild(contributorDiv);
}

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".sidebar button");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove 'active' class from all buttons
            buttons.forEach(btn => btn.classList.remove("active"));

            // Add 'active' class to the clicked button
            button.classList.add("active");
        });
    });
});

//Branches

function getBranches() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/branches`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.main-commits-container');

                data.forEach(branch => {
                    const branchDiv = document.createElement('div');
                    branchDiv.className = 'chart';
                    if (branch.protected == false){
                       
                        branchDiv.style.backgroundColor = "#6FC276";
                    }
                    else if (branch.protected == true){
                        branchDiv.style.backgroundColor = "#ff746c";
                    }
                  

                    const nameB = document.createElement('p');
                    nameB.textContent = `Name: ${branch.name}`;

                    const branchesP = document.createElement('p');
                    branchesP.textContent = `Protected: ${branch.protected}`;

                    branchDiv.appendChild(nameB);
                    branchDiv.appendChild(branchesP);

                    mainDiv.appendChild(branchDiv);
                });
            })
            .catch(error => console.error(error));
    } else {
        console.error('Invalid GitHub URL');
    }
}

// AI Insights (Not done yet)

async function getAIInsights() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value.trim(); 
    if (!url) {
        console.error("URL input is empty!");
        return;
    }

    clearBox('main-commits-container');

    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub URL');
        return;
    }

    const username = match[1];
    const repository = match[2];

    try {
        const headers = {
            "Accept": "application/vnd.github.v3+json"
        };

       
        const [commitResponse, contributorResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${username}/${repository}/commits`, { headers }),
            fetch(`https://api.github.com/repos/${username}/${repository}/contributors`, { headers })
        ]);

        if (!commitResponse.ok || !contributorResponse.ok) {
            throw new Error(`GitHub API Error: ${commitResponse.statusText}, ${contributorResponse.statusText}`);
        }

        const commits = await commitResponse.json();
        const contributors = await contributorResponse.json();

        const commitMessages = commits.slice(0, 10).map(commit => commit.commit.message).join('\n');
        const contributorStats = contributors.map(contributor => `${contributor.login}: ${contributor.contributions}`).join('\n');

        
        const prompt = `Analyze this repo and tell me insights regarding the code style, cleanliness, functionality, issues: github.com/${username}/${repository}`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer API_KEY` 
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: 'You are an AI analyzing GitHub repositories.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!aiResponse.ok) throw new Error('OpenAI API error');

        const aiData = await aiResponse.json();

        // Display response
        const mainDiv = document.querySelector('.main-commits-container');
        const aiDiv = document.createElement('div');
        aiDiv.className = 'chart';
        aiDiv.textContent = aiData.choices[0]?.message?.content || "No AI response received.";
        mainDiv.appendChild(aiDiv);

    } catch (error) {
        console.error('Error fetching AI insights:', error);
    }
}

// Issues

function getIssues(){
    // id
    // number
    // title
    // user.login
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        const username = match[1];
        const repository = match[2];
        var count = 0;
        const apiUrl = `https://api.github.com/repos/${username}/${repository}/issues`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.main-commits-container');

                data.forEach(issue => {
                    const issueDiv = document.createElement('div');
                    issueDiv.className = 'chart';
                   

                    const nameI = document.createElement('p');
                    nameI.textContent = `ID: ${issue.id}`;

                    const issuesP = document.createElement('p');
                    issuesP.textContent = `Number: ${issue.number}`;

                    const titleI = document.createElement('p');
                    titleI.textContent = `Title: ${issue.title}`;

                    const userLoginP = document.createElement('p');
                    userLoginP.textContent = `User: ${issue.user.login}`;

                    issueDiv.appendChild(nameI);
                    issueDiv.appendChild(issuesP);
                    issueDiv.appendChild(titleI);
                    issueDiv.appendChild(userLoginP);
                    mainDiv.appendChild(issueDiv);
                    count++;
                });
                if ( count==0 ){
                    const issueDiv = document.createElement('div');
                    issueDiv.className = 'chart';

                    const messageI = document.createElement('p');
                    messageI.textContent = "No Issues";

                    issueDiv.appendChild(messageI);

                    mainDiv.appendChild(issueDiv);
                }
            })
            .catch(error => console.error(error));
    } else {
        console.error('Invalid GitHub URL');
    }
}

// Peak Hours


async function getAveragePeakHours() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);

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
                headers: { "Accept": "application/vnd.github.v3+json" }
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
        const avgHourlyCommits = hourCounts.map(count => count / totalDays);

        displayCommitHours(avgHourlyCommits);
    } catch (error) {
        console.error("Error fetching commits:", error);
    }
}



function displayCommitHours(avgHourlyCommits) {
    const mainDiv = document.querySelector('.main-commits-container');
    mainDiv.innerHTML = '';

    // max commit count to normalize values
    const maxCommits = Math.max(...avgHourlyCommits);

    avgHourlyCommits.forEach((avg, hour) => {
        const hourDiv = document.createElement('div');
        hourDiv.className = 'chart';
        hourDiv.style.height = "35px";

        const normalized = maxCommits > 0 ? avg / maxCommits : 0;
        const red = Math.floor(255 * (1 - normalized)); 
        const green = Math.floor(255 * normalized); 
        hourDiv.style.backgroundColor = `rgb(${red}, ${green}, 0)`;

        const hourLabel = document.createElement('p');
        hourLabel.textContent = `${hour}:00 - Avg ${avg.toFixed(2)} commits`;

        hourDiv.appendChild(hourLabel);
        mainDiv.appendChild(hourDiv);
    });
}

//Deployments

function getDeployments(){
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        const username = match[1];
        const repository = match[2];
        var count = 0;
        const apiUrl = `https://api.github.com/repos/${username}/${repository}/deployments`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.main-commits-container');

                data.forEach(deployment => {
                    const deploymentDiv = document.createElement('div');
                    deploymentDiv.className = 'chart';
                   

                    const idD = document.createElement('p');
                    idD.textContent = `ID: ${deployment.id}`;

                    const descrD = document.createElement('p');
                    descrD.textContent = `Description: ${deployment.description}`;

                    const creatD = document.createElement('p');
                    creatD.textContent = `Created at: ${deployment.created_at}`;

                  

                    deploymentDiv.appendChild(idD);
                    deploymentDiv.appendChild(descrD);
                    deploymentDiv.appendChild(creatD);
                  
                    mainDiv.appendChild(deploymentDiv);
                    count++;
                });
                if ( count==0 ){
                    const deploymentDiv = document.createElement('div');
                    deploymentDiv.className = 'chart';

                    const messageD = document.createElement('p');
                    messageD.textContent = "No Deployments";

                    deploymentDiv.appendChild(messageD);

                    mainDiv.appendChild(deploymentDiv);
                }
            })
            .catch(error => console.error(error));
    } else {
        console.error('Invalid GitHub URL');
    }
}


// JIRA

async function fetchIssues() {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/issues');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const issues = await response.json();
      
      const issuesList = document.getElementById('issues-list');
      if (issues.length === 0) {
        issuesList.innerHTML = '<tr><td colspan="8">No issues found.</td></tr>';
        return;
      }
      
      issuesList.innerHTML = issues.map(issue => {
        let statusClass = '';
        switch (issue.status.toLowerCase()) {
          case 'todo':
            statusClass = 'status-todo';
            break;
          case 'in progress':
            statusClass = 'status-in-progress';
            break;
          case 'done':
            statusClass = 'status-done';
            break;
          case 'dropped':
            statusClass = 'status-dropped';
            break;
          default:
            statusClass = '';
        }
  
        const createdDate = new Date(issue.created);
        const resolvedDate = issue.resolved !== "Unresolved" ? new Date(issue.resolved) : null;
        let duration = "Unresolved";
        if (resolvedDate) {
          const diffTime = Math.abs(resolvedDate - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
          if (diffDays > 1) {
            duration = `${diffDays} days`;
          } else if (diffDays === 1) {
            duration = "1 day";
          } else {
            duration = `${diffHours} hours`;
          }
        }
  
        return `
          <tr>
            <td>${issue.key}</td>
            <td class="summary">${issue.summary}</td>
            <td>${issue.assignee}</td>
            <td>${issue.reporter}</td>
            <td><span class="issue-status ${statusClass}">${issue.status}</span></td>
            <td>${createdDate.toLocaleDateString()}</td>
            <td>${resolvedDate ? resolvedDate.toLocaleDateString() : "Unresolved"}</td>
            <td>${duration}</td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      console.error('Error fetching issues:', error);
      document.getElementById('error-container').innerHTML = `
        <div class="error-message">
          Error loading issues: ${error.message}
        </div>
      `;
    }
  }
  
  async function getJiraIssues() {
    const jiraUrl = document.getElementById('jira-url').value;
    const apiToken = document.getElementById('api-token').value;
    const userEmail = document.getElementById('user-email').value;
  
    const baseUrl = jiraUrl.replace(/\/jira\/software\/projects\/.*$/, '/rest/api/3/search');
    const errorContainer = document.getElementById('error-container');
    const issuesList = document.getElementById('issues-list');
    const issuesTableHeader = document.getElementById('issues-table-header');
    
    errorContainer.innerHTML = ''; // Clear previous error messages
    issuesList.innerHTML = ''; // Clear previous issues
    issuesTableHeader.innerHTML = ''; // Clear previous table header
  
    if (!baseUrl.includes('/rest/api/3/search')) {
      errorContainer.innerHTML = '<div class="error-message">Invalid URL</div>';
      return;
    }
  
    try {
      const response = await fetch('http://127.0.0.1:5000/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ baseUrl, apiToken, userEmail }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
  
      const issues = await response.json();
  
      if (issues.length === 0) {
        issuesList.innerHTML = '<h2>No issues found for this project</h2>';
        return;
      }
  
      issuesTableHeader.innerHTML = `
        <tr>
          <th>Issue Key</th>
          <th>Summary</th>
          <th>Assignee</th>
          <th>Reporter</th>
          <th>Status</th>
          <th>Created</th>
          <th>Resolved</th>
          <th>Duration</th>
        </tr>
      `;
  
      issuesList.innerHTML = issues.map(issue => {
        let statusClass = '';
        switch (issue.status.toLowerCase()) {
          case 'todo':
            statusClass = 'status-todo';
            break;
          case 'in progress':
            statusClass = 'status-in-progress';
            break;
          case 'done':
            statusClass = 'status-done';
            break;
          case 'dropped':
            statusClass = 'status-dropped';
            break;
          default:
            statusClass = '';
        }
  
        const createdDate = new Date(issue.created);
        const resolvedDate = issue.resolved !== "Unresolved" ? new Date(issue.resolved) : null;
        let duration = "Unresolved";
        if (resolvedDate) {
          const diffTime = Math.abs(resolvedDate - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
          if (diffDays > 1) {
            duration = `${diffDays} days`;
          } else if (diffDays === 1) {
            duration = "1 day";
          } else {
            duration = `${diffHours} hours`;
          }
        }
  
        return `
          <tr>
            <td>${issue.key}</td>
            <td class="summary">${issue.summary}</td>
            <td>${issue.assignee}</td>
            <td>${issue.reporter}</td>
            <td><span class="issue-status ${statusClass}">${issue.status}</span></td>
            <td>${createdDate.toLocaleDateString()}</td>
            <td>${resolvedDate ? resolvedDate.toLocaleDateString() : "Unresolved"}</td>
            <td>${duration}</td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      errorContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
  }
  
// PULL

async function RequestDetails(url) {
    const response = await fetch(url);
    const details = await response.json();
    return details;
}
async function displayPullRequests() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value.trim();
    clearBox('main-commits-container');

    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub URL');
        return;
    }

    const username = match[1];
    const repository = match[2];

    let apiUrl = `https://api.github.com/repos/${username}/${repository}/pulls?per_page=100&state=all`;
    let pullRequests = [];

    try {
        while (apiUrl) {
            const response = await fetch(apiUrl, {
                headers: { "Accept": "application/vnd.github.v3+json" }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch pull requests: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.length) break; // Stop if no more PRs

            pullRequests = [...pullRequests, ...data];

            // Check for next page in GitHub pagination headers
            const linkHeader = response.headers.get("Link");
            const nextPageMatch = linkHeader ? linkHeader.match(/<([^>]+)>;\s*rel="next"/) : null;
            apiUrl = nextPageMatch ? nextPageMatch[1] : null;
        }

        displayPRs(pullRequests);
    } catch (error) {
        console.error("Error fetching pull requests:", error);
    }
}

function displayPRs(pullRequests) {
    const pullRequestContainer = document.querySelector('.main-commits-container');
    pullRequestContainer.innerHTML = ''; // Clear previous content

    if (pullRequests.length === 0) {
        const noPullRequestsMessage = document.createElement('p');
        noPullRequestsMessage.textContent = 'No pull requests found.';
        pullRequestContainer.appendChild(noPullRequestsMessage);
        return;
    }

    pullRequests.forEach(pr => {
        const prDiv = document.createElement('div');
        prDiv.className = 'chart';

        // prDiv.className = pr.state === 'open' ? 'open-pr' : 'closed-pr'; 

        if (pr.state === 'open'){
            prDiv.style.backgroundColor = `green`;

        } 
        else{
            prDiv.style.backgroundColor = `lightcoral`;
        }

        const titleP = document.createElement('p');
        titleP.textContent = `Title: ${pr.title}`;

        const authorP = document.createElement('p');
        authorP.textContent = `Author: ${pr.user.login}`;

        const createdAtP = document.createElement('p');
        const createdAtDate = new Date(pr.created_at);
        createdAtP.textContent = `Opened On: ${createdAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        prDiv.appendChild(titleP);
        prDiv.appendChild(authorP);
        prDiv.appendChild(createdAtP);

        pullRequestContainer.appendChild(prDiv);
    });
}

function clearBox(elementID) {
    document.getElementById(elementID).innerHTML = "";
}


function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main');
    const chartContent = document.getElementById('chart');

    if (sidebar.classList.contains('open')) {
        sidebar.classList.add('closing');

        mainContent.classList.remove('blur-background');
        if (chartContent) chartContent.classList.remove('blur-background');

        // Wait for animation to complete before hiding
        sidebar.addEventListener('animationend', () => {
            sidebar.classList.remove('open', 'closing');
            sidebar.style.display = 'none';
        }, { once: true });

        console.log("Sidebar closed");

    } else {
        sidebar.style.display = 'flex';  // Make sure it's visible first
        requestAnimationFrame(() => {   // Wait for the next frame to apply animation smoothly
            sidebar.classList.add('open');
        });

        sidebar.classList.remove('closing');
        mainContent.classList.add('blur-background');
        if (chartContent) chartContent.classList.add('blur-background');

        console.log("Sidebar opened");
    }
}

function toggleDropdown(id) {
    const dropdownContent = document.getElementById(id);
    const arrowIcon = dropdownContent.previousElementSibling.querySelector('.uil');
    if (dropdownContent.classList.contains('show')) {
        dropdownContent.classList.remove('show');
        arrowIcon.classList.remove('uil-arrow-up');
        arrowIcon.classList.add('uil-arrow-down');
    } else {
        dropdownContent.classList.add('show');
        arrowIcon.classList.remove('uil-arrow-down');
        arrowIcon.classList.add('uil-arrow-up');
    }
}

// Filter Commits
function filterCommits(commits, sortOption) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const filteredCommits = commits.filter(commit => {
        const commitDate = new Date(commit.commit.author.date);
        switch (sortOption) {
            case 'today':
                return commitDate.toDateString() === today.toDateString();
            case 'this-month':
                return commitDate >= startOfMonth && commitDate <= today;
            default:
                const [month, year] = sortOption.split('-');
                const startOfSelectedMonth = new Date(year, new Date(Date.parse(month +" 1, 2012")).getMonth(), 1);
                const endOfSelectedMonth = new Date(year, new Date(Date.parse(month +" 1, 2012")).getMonth() + 1, 0);
                return commitDate >= startOfSelectedMonth && commitDate <= endOfSelectedMonth;
        }
    });
    return filteredCommits;
}

// Buttons

document.addEventListener("DOMContentLoaded", () => {
    const commitBtn = document.querySelector('.commit-btn');
    const progressBtn = document.querySelector('.progress-btn');
    const contributorsBtn = document.querySelector('.contributors-btn');
    const insightsBtn = document.querySelector('.insights-btn');
    const branchesBtn = document.querySelector('.branches-btn');
    const issuesBtn = document.querySelector('.issues-btn');
    const peakBtn = document.querySelector('.peak-btn');
    const deploymentBtn = document.querySelector('.deployment-btn');
    const pullBtn = document.querySelector('.pull-btn');

    

    if (commitBtn) commitBtn.addEventListener('click', fetchData);
    if (progressBtn) progressBtn.addEventListener('click', createChart);
    if (contributorsBtn) contributorsBtn.addEventListener('click', getContributors);
    if (insightsBtn) insightsBtn.addEventListener('click', getAIInsights);
    if (branchesBtn) branchesBtn.addEventListener('click', getBranches);
    if (issuesBtn) issuesBtn.addEventListener('click', getIssues);
    if (peakBtn) peakBtn.addEventListener('click', getAveragePeakHours);
    if (deploymentBtn) deploymentBtn.addEventListener('click', getDeployments);
    if (pullBtn) pullBtn.addEventListener('click', displayPullRequests);
    
});
