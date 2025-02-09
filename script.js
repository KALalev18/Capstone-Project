function handleSubmit(event) {
    const url = new URL(form.action);
    const formData = new FormData(form);
  
    /** @type {Parameters<fetch>[1]} */
    const fetchOptions = {
      method: form.method,
      body: formData,
    };
  
    fetch(url, fetchOptions);
  
    event.preventDefault();
  }
function clearBox(elementClass) {
    document.querySelector(`.${elementClass}`).innerHTML = "";
  }
function fetchData() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    // Extract the username and repository name from the input URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const username = match[1];
      const repository = match[2];
  
    
      // Fetch the repository data from the GitHub API
      const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits?per_page=100`;
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          const mainDiv = document.querySelector('.main-commits-container');
  
          data.forEach(commit => {
            const commitDiv = document.createElement('div');
            commitDiv.className = 'chart';
  
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
document.addEventListener('DOMContentLoaded', function () {
    function createChart() {
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

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits`;
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                const commitData = {};
                data.forEach(commit => {
                    const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
                    commitData[date] = (commitData[date] || 0) + 1;
                });

                const dates = Object.keys(commitData).sort((a, b) => new Date(a) - new Date(b));
                if (dates.length === 0) {
                    console.error('No commit data found.');
                    return;
                }

                const startDate = new Date(dates[0]);
                const endDate = new Date(dates[dates.length - 1]);
                const fullCommitData = {};

                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    fullCommitData[dateStr] = commitData[dateStr] || 0;
                }

                const chartData = Object.keys(fullCommitData).map(date => ({
                    date,
                    commits: fullCommitData[date]
                }));

                const canvas = document.getElementById('chart-line');
                if (!canvas) {
                    console.error('Canvas element with ID "chart" not found.');
                    return;
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Could not get 2D context for the canvas.');
                    return;
                }

                if (window.myChart) {
                    window.myChart.destroy();
                }

                window.myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map(commit => commit.date),
                        datasets: [{
                            label: 'Commits per day',
                            data: chartData.map(commit => commit.commits),
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                type: 'category',
                                ticks: {
                                    autoSkip: true,
                                    maxTicksLimit: 10
                                }
                            },
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching or processing data:', error);
            });
    }

    // Expose createChart to the global scope for the onclick event
    window.createChart = createChart;
});
function getContributors() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
  
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const username = match[1];
      const repository = match[2];
  
      const apiUrl = `https://api.github.com/repos/${username}/${repository}/contributors`;
  
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          const mainDiv = document.querySelector('.main-commits-container');
  
          data.forEach(contributor => {
            const contributorDiv = document.createElement('div');
            contributorDiv.className = 'chart';
  
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


function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main');
    const chartContent = document.getElementById('chart');

    if (sidebar.classList.contains('open')) {
        sidebar.classList.add('closing');
        mainContent.classList.remove('blur-background');
        chartContent.classList.remove('blur-background');

        sidebar.addEventListener('animationend', () => {
            sidebar.classList.remove('open', 'closing');
        }, { once: true });
    } else {
        sidebar.classList.add('open');
        mainContent.classList.add('blur-background');
        chartContent.classList.add('blur-background');
    }
}


// const url = new URL('https://github.com/cristian20021/LeetCode');

// const username = url.pathname.split('/')[1];
// const repository = url.pathname.split('/')[2];

// console.log(username); 
// console.log(repository); 


 