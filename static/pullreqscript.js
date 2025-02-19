


function clearBox(elementClass) {
    const element = document.querySelector(`.${elementClass}`);
    if (element) element.innerHTML = "";
}



async function fetchOpenPullRequests(username, repository) {
    const apiUrl = `https://api.github.com/repos/${username}/${repository}/pulls?state=open&per_page=10`;
    const response = await fetch(apiUrl);
    if (response.status === 403) {
        console.error('GitHub API rate limit exceeded or authentication required.');
        return [];
    }
    const pullRequests = await response.json();
    return pullRequests;
}

async function fetchClosedPullRequests(username, repository) {
    const apiUrl = `https://api.github.com/repos/${username}/${repository}/pulls?state=closed&per_page=10`;
    const response = await fetch(apiUrl);
    if (response.status === 403) {
        console.error('GitHub API rate limit exceeded or authentication required.');
        return [];
    }
    const pullRequests = await response.json();
    return pullRequests;
}

async function fetchPullRequestDetails(url) {
    const response = await fetch(url);
    const details = await response.json();
    return details;
}

function displayOpenPullRequests() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value.trim();

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

    fetchOpenPullRequests(username, repository)
        .then(async data => {
            const pullRequestContainer = document.querySelector('.pullrequest-container');
            pullRequestContainer.innerHTML = ''; // Clear previous content

            if (data.length === 0) {
                const noPullRequestsMessage = document.createElement('p');
                noPullRequestsMessage.textContent = 'No open pull requests found.';
                pullRequestContainer.appendChild(noPullRequestsMessage);
                return;
            }

            for (const pr of data) {
                const prDetails = await fetchPullRequestDetails(pr.url);

                const prDiv = document.createElement('div');
                prDiv.className = 'chart open-pr';

                const titleP = document.createElement('p');
                titleP.textContent = `Title: ${pr.title}`;

                const authorP = document.createElement('p');
                authorP.textContent = `Author: ${pr.user.login}`;

                const createdAtP = document.createElement('p');
                const createdAtDate = new Date(pr.created_at);
                createdAtP.textContent = `Opened On: ${createdAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

                const mergeConflictP = document.createElement('p');
                mergeConflictP.textContent = `Merge Conflict: ${prDetails.mergeable === false ? 'This branch has conflicts that must be resolved' : 'No conflicts with base branch'}`;

                prDiv.appendChild(titleP);
                prDiv.appendChild(authorP);
                prDiv.appendChild(createdAtP);
                prDiv.appendChild(mergeConflictP);

                pullRequestContainer.appendChild(prDiv);
            }

            // Hide closed pull requests
            document.querySelectorAll('.closed-pr').forEach(el => el.style.display = 'none');
            // Show open pull requests
            document.querySelectorAll('.open-pr').forEach(el => el.style.display = 'block');
        })
        .catch(error => {
            console.error('Error fetching or processing pull request data:', error);
        });
}

function displayClosedPullRequests() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value.trim();

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

    fetchClosedPullRequests(username, repository)
        .then(data => {
            const pullRequestContainer = document.querySelector('.pullrequest-container');
            pullRequestContainer.innerHTML = ''; // Clear previous content

            if (data.length === 0) {
                const noPullRequestsMessage = document.createElement('p');
                noPullRequestsMessage.textContent = 'No closed pull requests found.';
                pullRequestContainer.appendChild(noPullRequestsMessage);
                return;
            }

            data.forEach(pr => {
                const prDiv = document.createElement('div');
                prDiv.className = 'chart closed-pr';

                const titleP = document.createElement('p');
                titleP.textContent = `Title: ${pr.title}`;

                const authorP = document.createElement('p');
                authorP.textContent = `Author: ${pr.user.login}`;

                const closedAtP = document.createElement('p');
                const closedAtDate = pr.merged_at ? new Date(pr.merged_at) : new Date(pr.closed_at);
                const closedAtText = pr.merged_at ? 'Merged On' : 'Closed On';
                closedAtP.textContent = `${closedAtText}: ${closedAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

                prDiv.appendChild(titleP);
                prDiv.appendChild(authorP);
                prDiv.appendChild(closedAtP);

                pullRequestContainer.appendChild(prDiv);
            });

            // Hide open pull requests
            document.querySelectorAll('.open-pr').forEach(el => el.style.display = 'none');
            // Show closed pull requests
            document.querySelectorAll('.closed-pr').forEach(el => el.style.display = 'block');
        })
        .catch(error => {
            console.error('Error fetching or processing pull request data:', error);
        });
}
