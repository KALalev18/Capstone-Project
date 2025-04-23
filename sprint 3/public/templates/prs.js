document.addEventListener('DOMContentLoaded', async function displayPullRequests() {
    let repoUrl = window.repoUrl || localStorage.getItem('repoUrl'); // Fallback to localStorage
    if (!repoUrl) {
        console.error('Repository URL is missing.');
        return;
    }
    const githubToken = window.githubToken
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
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
})

function displayPRs(pullRequests) {
    const pullRequestContainer = document.querySelector('.content-upper');
    // pullRequestContainer.innerHTML = ''; // Clear previous content

    if (pullRequests.length === 0) {
        const noPullRequestsMessage = document.createElement('p');
        noPullRequestsMessage.textContent = 'No pull requests found.';
        pullRequestContainer.appendChild(noPullRequestsMessage);
        return;
    }

    pullRequests.forEach(pr => {
        const prDiv = document.createElement('div');
        prDiv.className = 'container';

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