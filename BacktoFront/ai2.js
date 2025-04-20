import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { Meteostat } from 'meteostat';

const sonarKey = process.env.sonar_key;
const githubKey = process.env.github_key;
const groqApiKey = process.env.groq_api_key;
const meteostat = new Meteostat(process.env.meteostat_key);

// === Fetch Sonar Issues ===
export async function getSonarStuff(projectKey) {
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

// === Get Weather Data ===
export async function getWeather(dateString) {
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

// === Groq Summarizer ===
export async function analyzeWithGroq(promptText) {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "mixtral-8x7b-32768",
            messages: [
                { role: "system", content: "You are a helpful assistant that summarizes SonarQube issues." },
                { role: "user", content: `Summarize the following SonarQube issues:\n\n${promptText}` }
            ],
            max_tokens: 500,
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error during Groq analysis:', error.message);
        return null;
    }
}

// === GitHub Commits ===
export async function getCommits(owner, repo, sinceDate) {
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

// === Commit Analyzer ===
export async function analyzeCommits(commits) {
    const messages = commits.map(commit =>
        `Commit by ${commit.commit.author.name}: ${commit.commit.message}`
    ).join('\n');

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-70b-8192",
            messages: [
                { role: "system", content: "You are a helpful assistant that summarizes GitHub commits." },
                { role: "user", content: `Analyze these commit messages:\n\n${messages}` }
            ],
            max_tokens: 500,
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error during commit analysis:', error.message);
        return null;
    }
}

// === Main Analysis Function ===
export async function getAnalysisData() {
    try {
        const sonarIssues = await getSonarStuff(sonarKey);
        const result = {
            sonarIssues: [],
            weatherData: [],
            githubCommits: [],
            commitAnalysis: null,
            issueAnalysis: null
        };

        if (sonarIssues.length > 0) {
            result.sonarIssues = sonarIssues;
            
            // Get weather for each issue
            for (const issue of sonarIssues) {
                const creationDate = issue.creationDate.slice(0, 10);
                result.weatherData.push({
                    date: creationDate,
                    weather: await getWeather(creationDate)
                });
            }

            // Get GitHub commits
            result.githubCommits = await getCommits("KALalev18", "Capstone-Project", "2025-01-01T00:00:00Z");
            
            if (result.githubCommits.length > 0) {
                result.commitAnalysis = await analyzeCommits(result.githubCommits);
            }

            // Generate issue summary
            const issueSummary = sonarIssues.map((issue, i) =>
                `Issue ${i+1}: ${issue.message} | Severity: ${issue.severity}`
            ).join('\n');
            
            result.issueAnalysis = await analyzeWithGroq(issueSummary);
        }

        return result;
    } catch (error) {
        console.error('Error in getAnalysisData:', error);
        throw error;
    }
}