document.addEventListener('DOMContentLoaded', () => {
    // Rely on the globally set repoUrl from db_commit.js
    const repoUrl = window.repoUrl;
    if (!repoUrl) {
        console.error('Repository URL not found.');
        return;
    }
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub repository URL:', repoUrl);
        return;
    }
    const username = match[1];
    const repository = match[2].replace(/\.git$/, '');
    const branchesApiUrl = `https://api.github.com/repos/${username}/${repository}/branches`;
  
    fetch(branchesApiUrl, {
        headers: { Authorization: `token ${window.githubToken}` }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const totalBranches = data.length;
            const protectedBranches = data.filter(branch => branch.protected).length;
            const nonProtectedBranches = totalBranches - protectedBranches;
  
            // Update branch card values in the dashboard (assumes three divs under .branch-header)
            const branchHeaderDivs = document.querySelectorAll('.branch-header > div');
            if (branchHeaderDivs.length >= 3) {
                // Total Branches
                branchHeaderDivs[0].querySelector('h1').textContent = totalBranches;
                // Protected Branches
                branchHeaderDivs[1].querySelector('h1').textContent = protectedBranches;
                // Non-protected Branches
                branchHeaderDivs[2].querySelector('h1').textContent = nonProtectedBranches;
            } else {
                console.error('Branch header elements not found.');
            }
        })
        .catch(error => console.error('Error fetching branch data:', error));
});