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
    const url = inputField.value.trim(); // Trim any extra spaces
    clearBox('main-commits-container');
    clearBox('sec-center');

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
                const secCenter = document.querySelector('.sec-center');
                const commitDates = data.map(commit => new Date(commit.commit.author.date));
                const uniqueMonths = [...new Set(commitDates.map(date => date.toLocaleString('default', { month: 'long', year: 'numeric' })))];

                // Clear existing dropdown options
                secCenter.innerHTML = '';

                // Add "Today" option if there are commits today
                const today = new Date();
                const todayCommits = data.filter(commit => new Date(commit.commit.author.date).toDateString() === today.toDateString());
                if (todayCommits.length > 0) {
                    const todayDropdown = document.createElement('div');
                    todayDropdown.className = 'monthdrop';
                    todayDropdown.innerHTML = `
                        <input class="dropdown" type="checkbox" id="dropdown-today" name="dropdown-today"/>
                        <label class="for-dropdown" for="dropdown-today" onclick="toggleDropdown('today-commits')"><i class="uil uil-arrow-down"></i>Today</label>
                        <div class="dropdown-content" id="today-commits"></div>
                    `;
                    secCenter.appendChild(todayDropdown);

                    const todayCommitsContainer = document.getElementById('today-commits');
                    todayCommits.forEach(commit => {
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

                        todayCommitsContainer.appendChild(commitDiv);
                    });
                }

                // Add unique month options
                const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
                uniqueMonths.forEach(month => {
                    const dropdownDiv = document.createElement('div');
                    dropdownDiv.className = 'monthdrop';
                    const label = month === currentMonth ? 'This Month' : month;
                    dropdownDiv.innerHTML = `
                        <input class="dropdown" type="checkbox" id="dropdown-${month}" name="dropdown-${month}"/>
                        <label class="for-dropdown" for="dropdown-${month}" onclick="toggleDropdown('${month.toLowerCase().replace(' ', '-')}-commits')"><i class="uil uil-arrow-down"></i>${label}</label>
                        <div class="dropdown-content" id="${month.toLowerCase().replace(' ', '-')}-commits"></div>
                    `;
                    secCenter.appendChild(dropdownDiv);

                    const monthCommitsContainer = document.getElementById(`${month.toLowerCase().replace(' ', '-')}-commits`);
                    const monthCommits = data.filter(commit => {
                        const commitDate = new Date(commit.commit.author.date);
                        return commitDate.toLocaleString('default', { month: 'long', year: 'numeric' }) === month &&
                               commitDate.toDateString() !== today.toDateString(); // Exclude today's commits
                    });

                    monthCommits.forEach(commit => {
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

                        monthCommitsContainer.appendChild(commitDiv);
                    });
                });
            })
            .catch(error => console.error(error));
    } else {
        console.error('Invalid GitHub URL');
    }
}

// Function to toggle the dropdown content, when the arrow changes direction from up to down and vice versa
function toggleDropdown(id) {
    const dropdownContent = document.getElementById(id);
    const arrowIcon = dropdownContent.previousElementSibling.querySelector('.uil');
    if (dropdownContent.classList.contains('show')) {
        dropdownContent.classList.remove('show');
        arrowIcon.classList.remove('uil-arrow-up');
        arrowIcon.classList.add('uil-arrow-down');
    } else {
        dropdownContent.classList.add('show');
        arrowIcon.classList.remove('uil-arrow-down');
        arrowIcon.classList.add('uil-arrow-up');
    }
}

function filterCommits(commits, sortOption) {
    // Filter commits based on the month sort option, so that only commits from the selected month are displayed
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const filteredCommits = commits.filter(commit => {
        const commitDate = new Date(commit.commit.author.date);
        switch (sortOption) {
            case 'today':
                return commitDate.toDateString() === today.toDateString();
            case 'this-month':
                return commitDate >= startOfMonth && commitDate <= today;
            default:
                const [month, year] = sortOption.split('-');
                const startOfSelectedMonth = new Date(year, new Date(Date.parse(month +" 1, 2012")).getMonth(), 1);
                const endOfSelectedMonth = new Date(year, new Date(Date.parse(month +" 1, 2012")).getMonth() + 1, 0);
                return commitDate >= startOfSelectedMonth && commitDate <= endOfSelectedMonth;
        }
    });
    return filteredCommits;
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

//this is for the sidebar when the user clicks on the hamburger icon using a small screen
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main');
    const chartContent = document.getElementById('chart');

    if (sidebar.classList.contains('open')) {
        sidebar.classList.add('closing');
        // Remove blur effect from main content and chart content
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


 