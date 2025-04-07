
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

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/contributors`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.content-upper');

                data.forEach(contributor => {
                    const contributorDiv = document.createElement('div');
                    contributorDiv.className = 'container';

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
);