document.addEventListener('DOMContentLoaded', async function () {
  const ctx = document.getElementById('contributionChart').getContext('2d');
  const colors = [
    'rgb(255, 99, 133)',
    'rgb(54, 163, 235)',
    'rgb(255, 207, 86)',
    'rgb(9, 189, 63)',
    'rgb(212, 12, 202)'
  ];

  // Shuffle the colors array
  const shuffledColors = colors.sort(() => 0.5 - Math.random());

  try {
    const match = window.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    const username = match[1];
    const repository = match[2];
    let page = 1;
    let contributors = [];
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await fetch(`https://api.github.com/repos/${username}/${repository}/contributors?per_page=100&page=${page}`, {
        headers: { Authorization: `token ${window.githubToken}` }
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      contributors = contributors.concat(data);

      // Check if there are more pages
      const linkHeader = response.headers.get('Link');
      hasNextPage = linkHeader && linkHeader.includes('rel="next"');
      page++;
    }

    const sortedContributors = contributors.sort((a, b) => b.contributions - a.contributions);
    
    // Modified logic: if 5 or fewer contributors, show all of them; otherwise show top 4 + Others
    let labels = [];
    let data = [];
    
    if (sortedContributors.length <= 5) {
      // If 5 or fewer contributors, show them all individually
      labels = sortedContributors.map(contributor => contributor.login);
      data = sortedContributors.map(contributor => contributor.contributions);
    } else {
      // More than 5 contributors, show top 4 + Others
      const topContributors = sortedContributors.slice(0, 4);
      const othersContributions = sortedContributors.slice(4).reduce((sum, contributor) => sum + contributor.contributions, 0);
      
      labels = topContributors.map(contributor => contributor.login).concat('Others');
      data = topContributors.map(contributor => contributor.contributions).concat(othersContributions);
    }

    // Update the number of contributors in the h3 element
    const contributorsCountElement = document.querySelector('.contribution-card h3');
    if (contributorsCountElement) {
      contributorsCountElement.textContent = `Contributors(${contributors.length})`;
    }

    const contributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Contributions',
          data: data,
          backgroundColor: shuffledColors.slice(0, labels.length),
          borderColor: shuffledColors.slice(0, labels.length).map(color => color.replace('rgb', 'rgba').replace(')', ', 1)')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          onComplete: () => {
            delayed = true;
          },
          delay: (context) => {
            let delay = 0;
            if (context.type === 'data' && context.mode === 'default' && !delayed) {
              delay = context.dataIndex * 200 + context.datasetIndex * 100;
            }
            return delay;
          },
        }
      }
    });
  } catch (error) {
    console.error('Error fetching contributors data:', error);
  }
});