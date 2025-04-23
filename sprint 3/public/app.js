document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch Sonar Issues
        const sonarResponse = await fetch('/api/sonar-issues');
        const sonarIssues = await sonarResponse.json();

        // Fetch Weather Data
        const weatherResponse = await fetch('/api/weather-data');
        const weatherData = await weatherResponse.json();

        // Fetch GitHub Commits
        const commitResponse = await fetch('/api/github-commits');
        const githubCommits = await commitResponse.json();

        // Fetch Commit Analysis
        const commitAnalysisResponse = await fetch('/api/commit-analysis');
        const commitAnalysis = await commitAnalysisResponse.json();

        // Fetch Sonar Analysis
        const sonarAnalysisResponse = await fetch('/api/sonar-analysis');
        const sonarAnalysis = await sonarAnalysisResponse.json();

        // Render Data on the Frontend
        renderData(sonarIssues, weatherData, githubCommits, commitAnalysis, sonarAnalysis);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

// Function to render data in HTML
function renderData(sonarIssues, weatherData, githubCommits, commitAnalysis, sonarAnalysis) {
    // Render Sonar Issues
    const issueList = document.getElementById('issue-list');
    sonarIssues.sonarIssues.forEach(issue => {
        const li = document.createElement('li');
        li.textContent = `${issue.message} (Created on: ${issue.creationDate})`;
        issueList.appendChild(li);
    });

    // Render Weather Data
    const weatherDetails = document.getElementById('weather-details');
    if (weatherData.weather) {
        weatherDetails.innerHTML = `
            <p>Temperature: ${weatherData.weather.temp} °C</p>
            <p>Humidity: ${weatherData.weather.humidity} %</p>
            <p>Wind Speed: ${weatherData.weather.wind_speed} m/s</p>
            <p>Weather: ${weatherData.weather.description}</p>
        `;
    }

    // Render GitHub Commits
    const commitList = document.getElementById('commit-list');
    if (githubCommits && githubCommits.length > 0) {
        githubCommits.forEach(commit => {
            const li = document.createElement('li');
            li.textContent = `${commit.commit.author.name}: ${commit.commit.message} (Date: ${commit.commit.author.date})`;
            commitList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No GitHub commits found.';
        commitList.appendChild(li);
    }

    // Render Commit Analysis
    const commitAnalysisDiv = document.getElementById('commit-analysis');
    commitAnalysisDiv.textContent = commitAnalysis.commitAnalysis;

    // Render Sonar Analysis
    const sonarAnalysisDiv = document.getElementById('sonar-analysis');
    sonarAnalysisDiv.textContent = sonarAnalysis.sonarAnalysis;
}
