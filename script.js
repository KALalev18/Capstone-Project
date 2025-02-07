
// TO DO 
// Add the branch section https://api.github.com/repos/{owner}/{repo}/branches
// Add the AI analysis


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
    const element = document.querySelector(`.${elementClass}`);
    if (element) element.innerHTML = "";
}


function fetchData() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits`;
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

function createChart() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value.trim();
    clearBox('main-commits-container');
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
            let canvas = document.getElementById('chart-line');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'chart-line';
                document.querySelector('.main-commits-container').appendChild(canvas);
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

function getContributors() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
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

function getInsights() {
    const mainDiv = document.querySelector('.main-commits-container');
    clearBox('main-commits-container');

    const contributorDiv = document.createElement('div');
    const disclaimer = document.createElement('h1');
    disclaimer.textContent = "No AI insights for now";

    contributorDiv.appendChild(disclaimer);
    mainDiv.appendChild(contributorDiv);
}

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".sidebar button");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove 'active' class from all buttons
            buttons.forEach(btn => btn.classList.remove("active"));

            // Add 'active' class to the clicked button
            button.classList.add("active");
        });
    });
});



function getBranches() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        const username = match[1];
        const repository = match[2];

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/branches`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const mainDiv = document.querySelector('.main-commits-container');

                data.forEach(branch => {
                    const branchDiv = document.createElement('div');
                    branchDiv.className = 'chart';
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
async function getAIInsights() {
    const inputField = document.querySelector('.input-field');
    const url = inputField.value;
    clearBox('main-commits-container');
    
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        console.error('Invalid GitHub URL');
        return;
    }
    
    const username = match[1];
    const repository = match[2];
    
    try {
        const commitResponse = await fetch(`https://api.github.com/repos/${username}/${repository}/commits`);
        const contributorResponse = await fetch(`https://api.github.com/repos/${username}/${repository}/contributors`);
        
        if (!commitResponse.ok || !contributorResponse.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const commits = await commitResponse.json();
        const contributors = await contributorResponse.json();
        
        const commitMessages = commits.map(commit => commit.commit.message).slice(0, 10).join('\n');
        const contributorStats = contributors.map(contributor => `${contributor.login}: ${contributor.contributions}`).join('\n');
        
        const prompt = `Analyse this repo and tell me insights regarding the code style, cleanliness, functionality, issues: github.com/${username}/${repository}`;
        
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer API_KEY` 
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{ role: 'system', content: 'You are an AI analyzing GitHub repositories.' }, { role: 'user', content: prompt }]
            })
        });
        
        const aiData = await aiResponse.json();
        
        const mainDiv = document.querySelector('.main-commits-container');
        const aiDiv = document.createElement('div');
        aiDiv.className = 'chart';
        aiDiv.textContent = aiData.choices[0].message.content;
        mainDiv.appendChild(aiDiv);
    } catch (error) {
        console.error('Error fetching AI insights:', error);
    }
}




document.addEventListener("DOMContentLoaded", () => {
    const commitBtn = document.querySelector('.commit-btn');
    const progressBtn = document.querySelector('.progress-btn');
    const contributorsBtn = document.querySelector('.contributors-btn');
    const insightsBtn = document.querySelector('.insights-btn');
    const branchesBtn = document.querySelector('.branches-btn');


    if (commitBtn) commitBtn.addEventListener('click', fetchData);
    if (progressBtn) progressBtn.addEventListener('click', createChart);
    if (contributorsBtn) contributorsBtn.addEventListener('click', getContributors);
    if (insightsBtn) insightsBtn.addEventListener('click', getAIInsights);
    if (branchesBtn) branchesBtn.addEventListener('click', getBranches);
});
