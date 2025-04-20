// ai2.mjs

import dotenv from 'dotenv';
import axios from 'axios';
import dayjs from 'dayjs';
import { Meteostat } from 'meteostat';

dotenv.config();

const sonarKey = process.env.sonar_key;
const githubKey = process.env.github_key;
const groqApiKey = process.env.groq_api_key;
const meteostat = new Meteostat(process.env.meteostat_key);

// === Fetch Sonar Issues ===
async function getSonarStuff(projectKey) {
    try {
        const response = await axios.get('https://sonarcloud.io/api/issues/search', {
            params: {
                componentKeys: projectKey,
                types: 'BUG,CODE_SMELL,VULNERABILITY',
                ps: 5
            }
        });
        return response.data.issues || [];
    } catch (error) {
        console.error('Error fetching SonarCloud data:', error.message);
        return [];
    }
}

// === Get Weather Data via Meteostat ===
async function getWeather(dateString) {
    try {
        const { data } = await meteostat.stations.hourly({
            station: '02847', // Helsinki-Vantaa
            start: dateString,
            end: dateString
        });

        if (data && data.length > 0) {
            const sample = data[0];
            return {
                temp: sample.temp,
                humidity: sample.rhum,
                wind_speed: sample.wspd,
                weather: [{ description: `Code: ${sample.coco}` }]
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        return null;
    }
}

// === Groq Summarizer for Sonar ===
async function analyzeWithGroq(promptText) {
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'mixtral-8x7b-32768',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that summarizes SonarQube issues.' },
                    { role: 'user', content: `Summarize the following SonarQube issues:\n\n${promptText}` }
                ],
                max_tokens: 500,
                temperature: 0.5
            },
            {
                headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error during Groq analysis:', error.message);
        return null;
    }
}

// === Fetch GitHub Commits ===
async function getCommits(owner, repo, sinceDate) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
    try {
        const response = await axios.get(url, {
            params: { since: sinceDate, per_page: 5 },
            headers: { Authorization: `token ${githubKey}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching GitHub commits:', error.message);
        return [];
    }
}

// === Groq Commit Summarizer ===
async function analyzeCommits(commits) {
    const messages = commits.map(commit =>
        `Commit by ${commit.commit.author.name}: ${commit.commit.message}`
    ).join('\n');

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that summarizes GitHub commits and predict the mood of the user.' },
                    { role: 'user', content: `Analyze the following GitHub commit messages and provide a summary of key changes:\n\n${messages}` }
                ],
                max_tokens: 500,
                temperature: 0.5
            },
            {
                headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error during Groq commit analysis:', error.message);
        return null;
    }
}

// === Main Logic ===
(async function main() {
    const sonarIssues = await getSonarStuff(sonarKey);

    if (sonarIssues.length > 0) {
        console.log(`Found ${sonarIssues.length} issues in SonarCloud...`);

        for (let i = 0; i < sonarIssues.length; i++) {
            const issue = sonarIssues[i];
            const creationDate = issue.creationDate.slice(0, 10);
            console.log(`\nIssue ${i + 1}: ${issue.message}`);
            console.log(`Issue created on: ${creationDate}`);

            const weatherData = await getWeather(creationDate);

            if (weatherData) {
                console.log(`\nWeather data for ${creationDate}:`);
                console.log(`Temperature: ${weatherData.temp} °C`);
                console.log(`Humidity: ${weatherData.humidity} %`);
                console.log(`Wind Speed: ${weatherData.wind_speed} m/s`);
                console.log(`Weather: ${weatherData.weather[0].description}`);
            } else {
                console.log('No weather data available for this date.');
            }
        }

        const githubCommits = await getCommits('KALalev18', 'Capstone-Project', '2025-01-01T00:00:00Z');

        if (githubCommits.length > 0) {
            console.log('\nRecent GitHub Commits:');
            githubCommits.forEach(commit => {
                console.log(`Commit by ${commit.commit.author.name}: ${commit.commit.message}`);
                console.log(`Date: ${commit.commit.author.date}`);
                console.log('------------------------------------------------------------');
            });

            console.log('\nAnalyzing GitHub commit messages with Groq...');
            const commitAnalysis = await analyzeCommits(githubCommits);
            console.log('Groq Commit Analysis Result:');
            console.log(commitAnalysis);
        }

        const issueSummary = sonarIssues.map((issue, i) =>
            `Issue ${i + 1}: ${issue.message} | Severity: ${issue.severity} | Date: ${issue.creationDate}`
        ).join('\n');

        console.log('\nAnalyzing SonarQube data with Groq...');
        const issueAnalysis = await analyzeWithGroq(issueSummary);
        console.log('Groq SonarQube Analysis Result:');
        console.log(issueAnalysis);
    } else {
        console.log('No valid SonarQube data found for analysis.');
    }
})();
