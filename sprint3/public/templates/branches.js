
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

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/branches`;
        fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const mainDiv = document.querySelector('.content-upper');

            data.forEach(branch => {
                const branchDiv = document.createElement('div');
                branchDiv.className = 'container';
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
);