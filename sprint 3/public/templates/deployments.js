
document.addEventListener('DOMContentLoaded', async function () {
    let repoUrl = window.repoUrl || localStorage.getItem('repoUrl'); // Fallback to localStorage
    if (!repoUrl) {
        console.error('Repository URL is missing.');
        return;
    }
    const githubToken = window.githubToken
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    var count = 0;
    if (!match) {
        console.error('Invalid GitHub URL');
        return;
    }
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/deployments`;

        fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const mainDiv = document.querySelector('.content-upper');

            data.forEach(deployment => {
                const deploymentDiv = document.createElement('div');
                deploymentDiv.className = 'container';
               

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
);