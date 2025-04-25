document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('issuesDoughnutChart').getContext('2d');
    // Make the chart instance global by attaching to window
    window.issuesDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Open', 'Closed'],
            datasets: [{
                data: [10, 20], // initial dummy data; will be updated from GitHub
                backgroundColor: ['rgb(112, 255, 99)', 'rgb(223, 14, 14)'],
                hoverBackgroundColor: ['rgba(112, 255, 99, 0.38)', 'rgba(223, 14, 14, 0.38)'],
                borderColor: 'rgba(243, 243, 243, 0.55)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return tooltipItem.label + ': ' + tooltipItem.raw;
                        }
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
                }
            }
        }
    });
    
    // Fetch and update the doughnut chart with live issue counts.
    fetchAndUpdateIssuesDoughnutChart();
});

// New function to fetch and display the top 5 recent open issues in the Issues card table
async function fetchAndDisplayIssues() {
    if (!window.repoUrl) {
        console.error('Repository URL not defined.');
        return;
    }
    const match = window.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub repository URL.');
        return;
    }
    const username = match[1];
    const repository = match[2].replace(/\.git$/, '');
    const apiUrl = `https://api.github.com/repos/${username}/${repository}/issues?state=open&sort=created&direction=desc&per_page=5`;

    try {
        const response = await fetch(apiUrl, {
            headers: { Authorization: `token ${window.githubToken}` }
        });
        if (!response.ok) {
            console.error('Failed to fetch issues:', response.statusText);
            return;
        }
        const issues = await response.json();
        const tbody = document.querySelector('.issues-card tbody');
        if (!tbody) {
            console.error('Issues table body not found.');
            return;
        }
        tbody.innerHTML = ''; // Clear existing rows

        // Ensure we have 5 rows; if there are less than 5 issues, fill with "No issues"
        for (let i = 0; i < 5; i++) {
            let rowHtml;
            if (i < issues.length) {
                const issue = issues[i];
                const title = issue.title || 'No issues';
                const truncatedTitle = title.length > 30 ? title.slice(0, 30) + '...' : title;
                const createdDate = new Date(issue.created_at);
                const formattedDate = formatDate(createdDate);
                rowHtml = `
                    <tr>
                        <td class="px-4 py-4">${truncatedTitle}</td>
                        <td class="px-4 py-4">${formattedDate}</td>
                    </tr>`;
            } else {
                rowHtml = `
                    <tr>
                        <td class="px-4 py-4">No issues</td>
                        <td class="px-4 py-4">No issues</td>
                    </tr>`;
            }
            tbody.innerHTML += rowHtml;
        }
    } catch (error) {
        console.error('Error fetching issues:', error);
    }
}

async function fetchAndUpdateIssuesDoughnutChart() {
    if (!window.repoUrl) {
        console.error('Repository URL not defined.');
        return;
    }
    const match = window.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub repository URL.');
        return;
    }
    const username = match[1];
    const repository = match[2];
    
    // Build search URLs for open and closed issues
    const openIssuesUrl = `https://api.github.com/search/issues?q=repo:${username}/${repository}+type:issue+state:open`;
    const closedIssuesUrl = `https://api.github.com/search/issues?q=repo:${username}/${repository}+type:issue+state:closed`;
    
    try {
        const [openResponse, closedResponse] = await Promise.all([
            fetch(openIssuesUrl, { headers: { Authorization: `token ${window.githubToken}` } }),
            fetch(closedIssuesUrl, { headers: { Authorization: `token ${window.githubToken}` } })
        ]);
        if (!openResponse.ok || !closedResponse.ok) {
            console.error('Failed to fetch issue counts from GitHub.');
            return;
        }
        const openData = await openResponse.json();
        const closedData = await closedResponse.json();
        const openCount = openData.total_count;
        const closedCount = closedData.total_count;
        
        // Update doughnut chart data
        if (window.issuesDoughnutChart) {
            window.issuesDoughnutChart.data.datasets[0].data = [openCount, closedCount];
            window.issuesDoughnutChart.update();
        }
        
        // Update the h3 element with the actual total issue count
        const totalIssues = openCount + closedCount;
        const issuesCountElement = document.querySelector('.issues-card h3');
        if (issuesCountElement) {
            issuesCountElement.textContent = `Issues(${totalIssues})`;
        } else {
            // If the h3 doesn't exist yet, create it
            const issuesCard = document.querySelector('.issues-card');
            if (issuesCard) {
                const headerElement = document.createElement('h3');
                headerElement.textContent = `Issues(${totalIssues})`;
                headerElement.classList.add('text-center');
                
                // Insert at the beginning of the issues card
                const firstElement = issuesCard.querySelector('.text-center.mb-5.mt-3');
                if (firstElement) {
                    issuesCard.insertBefore(headerElement, firstElement);
                } else {
                    issuesCard.insertBefore(headerElement, issuesCard.firstChild);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching issue counts:', error);
        
        // Update with error indicator if there's an issue
        const issuesCountElement = document.querySelector('.issues-card h3');
        if (issuesCountElement) {
            issuesCountElement.textContent = 'Issues(-)';
        }
    }
}

function formatDate(date) {
    const day = date.getDate();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) {
        suffix = 'st';
    } else if (day % 10 === 2 && day !== 12) {
        suffix = 'nd';
    } else if (day % 10 === 3 && day !== 13) {
        suffix = 'rd';
    }
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}${suffix}-${month}-${year}`;
}

// Call fetchAndDisplayIssues after the DOM loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayIssues);