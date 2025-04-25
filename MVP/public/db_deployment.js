document.addEventListener('DOMContentLoaded', async function () {
  const repoUrl = window.repoUrl;
  const githubToken = window.githubToken;
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    console.error('Invalid GitHub repository URL:', repoUrl);
    return;
  }
  const username = match[1];
  const repository = match[2].replace(/\.git$/, ''); // Remove .git suffix if present
  const apiUrl = `https://api.github.com/repos/${username}/${repository}/deployments`;

  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `token ${githubToken}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deployments: ${response.statusText}`);
    }

    const deployments = await response.json();
    
    // Update the deployment count in the h3 element
    const deploymentCountElement = document.querySelector('.deployment-card h3');
    if (deploymentCountElement) {
      deploymentCountElement.textContent = `Deployments(${deployments.length})`;
    } else {
      // If no h3 exists, create one
      const deploymentCard = document.querySelector('.deployment-card');
      if (deploymentCard) {
        const headerElement = document.createElement('h3');
        headerElement.textContent = `Deployments(${deployments.length})`;
        headerElement.classList.add('text-center', 'mb-3');
        
        // Insert at the beginning of the deployment card
        deploymentCard.insertBefore(headerElement, deploymentCard.firstChild);
      }
    }
    
    const deploymentTableBody = document.querySelector('.deployment-card tbody');
    deploymentTableBody.innerHTML = ''; // Clear previous content

    // Loop exactly five times
    for (let i = 0; i < 5; i++) {
        let rowHtml;
        if (i < deployments.length) {
            const deployment = deployments[i];
            const description = deployment.description || 'No description';
            const truncatedDescription = description.length > 40 ? description.slice(0, 40) + '...' : description;

            const createdAt = new Date(deployment.created_at);
            const day = createdAt.getDate();
            const month = createdAt.toLocaleString('default', { month: 'short' });
            const year = createdAt.getFullYear().toString().slice(-2);
            const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                           (day % 10 === 2 && day !== 12) ? 'nd' :
                           (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
            const formattedDate = `${day}${suffix}-${month}-${year}`;

            rowHtml = `
                <tr>
                    <td class="px-4 py-3">${truncatedDescription}</td>
                    <td class="px-4 py-3">${formattedDate}</td>
                </tr>`;
        } else {
            rowHtml = `
                <tr>
                    <td class="px-4 py-3">No Deployments</td>
                    <td class="px-4 py-3">No Date</td>
                </tr>`;
        }
        deploymentTableBody.innerHTML += rowHtml;
    }
  } catch (error) {
    console.error('Error fetching deployment data:', error);
    
    // Update the header with error indication if there's an issue
    const deploymentCountElement = document.querySelector('.deployment-card h3');
    if (deploymentCountElement) {
      deploymentCountElement.textContent = 'Deployments(-)';
    }
  }
});