
document.addEventListener('DOMContentLoaded', async function () {
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
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.content-upper');

                data.forEach(commit => {
                    const commitDiv = document.createElement('div');
                    commitDiv.className = 'container';

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
);