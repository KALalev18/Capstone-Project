
document.addEventListener('DOMContentLoaded', async function () {
    let repoUrl = window.repoUrl || localStorage.getItem('repoUrl'); // Fallback to localStorage
    if (!repoUrl) {
        console.error('Repository URL is missing.');
        return;
    }
    var count = 0;
    const githubToken = window.githubToken
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub URL');
        return;
    }
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/issues`;

       
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.content-upper');

                data.forEach(issue => {
                    const issueDiv = document.createElement('div');
                    issueDiv.className = 'container';
                   

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
);