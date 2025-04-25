const repoUrlLS = localStorage.getItem('repoUrl');
if (!repoUrlLS) {
    console.error('Repository URL not found in localStorage.');
} else {
    // Remove .git suffix from the URL before storing it globally
    window.repoUrl = repoUrlLS.replace(/\.git$/, '');
}


// Initialize token variable
let githubToken = '';

// Fetch the GitHub token from the server
async function fetchGithubToken() {
    try {
        const response = await fetch('/api/github-token');
        if (!response.ok) {
            throw new Error('Failed to fetch GitHub token');
        }
        const data = await response.json();
        githubToken = data.token;
        window.githubToken = githubToken; // Expose token for other modules
        
        // Once we have the token, proceed with fetching commit data
        fetchCommitData();
    } catch (error) {
        console.error('Error fetching GitHub token:', error);
    }
}

// Display the repository name in the dashboard
document.addEventListener('DOMContentLoaded', function() {
    try {
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
            const username = match[1];
            const repository = match[2];
        }
    } catch (error) {
        console.error('Error parsing repository URL:', error);
    }
    
    // Fetch the GitHub token when the page loads
    fetchGithubToken();
});

async function fetchCommitData() {
    // Update the pattern matching for repository URLs to handle .git suffix
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?/);
    if (!match) {
        console.error('Invalid GitHub URL');
        return;
    }
    const username = match[1];
    // Remove .git suffix if present
    const repository = match[2];
    const perPage = 100;
    let page = 1;
    let allCommits = [];
    let hasNextPage = true;

    try {
        while (hasNextPage) {
            const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits?per_page=${perPage}&page=${page}`;
            const response = await fetch(apiUrl, {
                headers: { Authorization: `token ${githubToken}` }
            });
            if (response.status === 403) {
                console.error('403 Forbidden. You might be hitting the GitHub API rate limit.');
                return;
            }
            const data = await response.json();
            // If the response is not an array, log an error and break.
            if (!Array.isArray(data)) {
                console.error('Unexpected API response:', data);
                return;
            }
            allCommits = allCommits.concat(data);

            // GitHub API uses the Link header for pagination.
            const linkHeader = response.headers.get('Link');
            if (linkHeader && linkHeader.includes('rel="next"')) {
                page++;
            } else {
                hasNextPage = false;
            }
        }

        // Calculate total commits using commit API data
        const totalCommits = allCommits.length;
        
        // Instead of using commitCounts from the commit API,
        // fetch the complete contributor data from GitHub for an accurate most committer count.
        async function fetchContributorData(username, repository) {
            let page = 1;
            let contributors = [];
            let hasNextPage = true;
            while (hasNextPage) {
                const response = await fetch(`https://api.github.com/repos/${username}/${repository}/contributors?per_page=100&page=${page}`, {
                    headers: { Authorization: `token ${githubToken}` }
                });
                if (!response.ok) {
                    console.error(`Error fetching contributors: ${response.status} ${response.statusText}`);
                    break;
                }
                const data = await response.json();
                contributors = contributors.concat(data);
                const linkHeader = response.headers.get('Link');
                hasNextPage = linkHeader && linkHeader.includes('rel="next"');
                page++;
            }
            return contributors;
        }

        let mostCommitter = '';
        let mostCommitterCommits = 0;
        let topContributor = null;
        try {
            // 'username' and 'repository' are already declared above from the repoUrl match.
            const contributorsData = await fetchContributorData(username, repository);
            if (contributorsData && contributorsData.length > 0) {
                contributorsData.sort((a, b) => b.contributions - a.contributions);
                topContributor = contributorsData[0];
                mostCommitterCommits = topContributor.contributions;
            }
        } catch (error) {
            console.error('Error fetching contributor data:', error);
        }

        if (topContributor) {
            try {
                // Fetch the actual user profile data to get the real name
                const userResponse = await fetch(`https://api.github.com/users/${topContributor.login}`, {
                    headers: { Authorization: `token ${githubToken}` }
                });
                if (!userResponse.ok) {
                    throw new Error(`${userResponse.status}: ${userResponse.statusText}`);
                }
                const userData = await userResponse.json();
                // Use the 'name' field if available, otherwise fallback to the login
                mostCommitter = userData.name ? userData.name : topContributor.login;
                // If the name contains '/', extract only the name before '/'
                if (mostCommitter.includes('/')) {
                    mostCommitter = mostCommitter.split('/')[0].trim();
                }
            } catch (error) {
                console.error('Error fetching user profile data:', error);
                mostCommitter = topContributor.login;
            }
        }

        // Calculate first and latest commit dates using commit API data
        const commitDates = allCommits
            .map(commit => new Date(commit?.commit?.author?.date))
            .filter(date => !isNaN(date));
        const firstDate = new Date(Math.min(...commitDates));
        const latestDate = new Date(Math.max(...commitDates));

        // Helper function to format dates with ordinal suffix (e.g., 12th May 2020)
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
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            return `${day}${suffix} ${month} ${year}`;
        }
        const commitRangeText = `${formatDate(firstDate)} - ${formatDate(latestDate)}`;

        // Update the commit card in the dashboard
        const commitH1s = document.querySelectorAll('.commit-header h1');
        const commitPs = document.querySelectorAll('.commit-header p');
        const commitFooterP = document.querySelector('.commit-footer p');

        if (commitH1s.length >= 2 && commitPs.length >= 2 && commitFooterP) {
            commitH1s[0].textContent = totalCommits;
            commitPs[0].textContent = `Total commits`;
            commitH1s[1].textContent = `${mostCommitter} (${mostCommitterCommits})`;
            commitPs[1].textContent = `Most Committer (No.)`;
            commitFooterP.textContent = commitRangeText;
        } else {
            console.error('Error: Commit card elements not found in the DOM.');
        }

        // Calculate daily commit counts based on commit dates
        // JavaScript's getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
        const dailyCounts = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
        allCommits.forEach(commit => {
            const date = new Date(commit?.commit?.author?.date);
            if (!isNaN(date)) {
                const day = date.getDay();
                dailyCounts[day] = (dailyCounts[day] || 0) + 1;
            }
        });
        // Order counts as: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
        const orderedCounts = [
            dailyCounts[1] || 0, 
            dailyCounts[2] || 0, 
            dailyCounts[3] || 0, 
            dailyCounts[4] || 0, 
            dailyCounts[5] || 0, 
            dailyCounts[6] || 0, 
            dailyCounts[0] || 0
        ];
        // Determine the maximum count and round up to nearest 10 (e.g., 67 becomes 70)
        const maxCount = Math.max(...orderedCounts);
        const yAxisMax = Math.ceil(maxCount / 10) * 10 || 10; // default to 10 if maxCount is 0

        // Update the commits bar chart if it exists.
        if (typeof commitsChart !== 'undefined') {
            commitsChart.data.datasets[0].data = orderedCounts;
            commitsChart.options.scales.y.max = yAxisMax;
            commitsChart.update();
        }

        
    } catch (error) {
        console.error('Error fetching commit data:', error);
    }

    window.allCommits = allCommits;



    // Ensure updateProgressChart is called after setting window.allCommits
    if (typeof updateProgressChart === 'function') {
        updateProgressChart();
    }
}

// IMPORTANT: Remove or comment out this direct call since we now call it after fetching the token
// fetchCommitData();

var ctx = document.getElementById('commitsChart').getContext('2d');
var delayed = false;
var commitsChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Commit Activity',
            // initial dummy data; will be updated in fetchCommitData()
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(198, 13, 223, 0.91)',
            borderColor: 'rgba(172, 9, 212, 0.55)',
            borderWidth: 1
        }],
    },
    options: {
        maintainAspectRatio: false,
        scales: {
            x: { grid: { display: false } },
            y: { 
                beginAtZero: true,
                max: 10, // default max; will be updated
                grid: { display: true, color: 'rgba(255, 255, 255, 0.05)' }
            }
        },
        animation: {
            onComplete: () => { delayed = true; },
            delay: (context) => {
                let delay = 0;
                if (context.type === 'data' && context.mode === 'default' && !delayed) {
                    delay = context.dataIndex * 200 + context.datasetIndex * 100;
                }
                return delay;
            },
        },
    },
});

