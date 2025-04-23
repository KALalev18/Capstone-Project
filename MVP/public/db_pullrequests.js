document.addEventListener('DOMContentLoaded', async () => {
    // Use the globally exposed repoUrl from db_commit.js
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
    const repository = match[2];
    
    let allPRs = [];
    let page = 1;
    let hasNextPage = true;
  
    try {
        while(hasNextPage) {
            const prApiUrl = `https://api.github.com/repos/${username}/${repository}/pulls?state=all&per_page=100&page=${page}`;
            const response = await fetch(prApiUrl, {
                headers: { Authorization: `token ${window.githubToken}` }
            });
            if (!response.ok) {
                throw new Error(`${response.status}: ${response.statusText}`);
            }
            const prs = await response.json();
            allPRs = allPRs.concat(prs);
  
            // Determine if there is another page via the Link header
            const linkHeader = response.headers.get('Link');
            if(linkHeader && linkHeader.includes('rel="next"')) {
                page++;
            } else {
                hasNextPage = false;
            }
        }
  
        const totalPR = allPRs.length;
        const openPR = allPRs.filter(pr => pr.state === 'open').length;
        const closedPR = allPRs.filter(pr => pr.state === 'closed').length;
  
        // To determine merge conflicts, fetch each open PR's details.
        // Merge conflict is assumed if mergeable === false.
        let conflictCount = 0;
        const openPRs = allPRs.filter(pr => pr.state === 'open');
        const prDetailsList = await Promise.all(
            openPRs.map(async pr => {
                try {
                    const detailResponse = await fetch(pr.url, {
                        headers: { Authorization: `token ${window.githubToken}` }
                    });
                    if (detailResponse.ok) {
                        return await detailResponse.json();
                    }
                } catch (err) {
                    console.error('Error fetching PR details:', err);
                }
                return null;
            })
        );
        prDetailsList.forEach(detail => {
            // detail.mergeable can be null until GitHub calculates it.
            // Here we count those that explicitly evaluate to false.
            if (detail && detail.mergeable === false) {
                conflictCount++;
            }
        });
  
        const headerDivs = document.querySelectorAll('.pull-request-header > div');
        if (headerDivs.length >= 4) {
            headerDivs[0].querySelector('h1').textContent = totalPR;
            headerDivs[1].querySelector('h1').textContent = openPR;
            headerDivs[2].querySelector('h1').textContent = closedPR;
            
            // Set conflict count
            const conflictElement = headerDivs[3].querySelector('h1');
            conflictElement.textContent = conflictCount;
            
            // Change color based on conflict count
            const conflictDiv = headerDivs[3];
            if (conflictCount === 0) {
                conflictDiv.style.color = 'rgb(33, 255, 86)'; // Green color for no conflicts
            } else {
                conflictDiv.style.color = 'rgb(235, 9, 9)'; // Keep red for conflicts
            }
        } else {
            console.error('Pull request header elements not found.');
        }
    } catch (error) {
        console.error('Error fetching pull request data:', error);
    }
});