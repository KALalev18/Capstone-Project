import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import fs, { promises as fsPromises } from 'fs';
<<<<<<< HEAD
import axios from 'axios';

dotenv.config();
const app = express();
=======
import Sentiment from 'sentiment';
const sentiment = new Sentiment();
const port = 3000;
import axios from "axios";


dotenv.config();
const app = express();
app.use(express.static("public"));
app.use(express.json());  // This enables parsing of JSON request bodies

const GITHUB_API_URL = "https://api.github.com/repos/{owner}/{repo}/commits";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6

// Setup storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

// Update multer configuration to allow up to 15 files
const upload = multer({ 
    storage: storage,
    limits: { files: 15 } // Allow up to 15 files
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')){
    fs.mkdirSync('uploads');
}

const API_KEY = process.env.GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions"; 

app.use(express.static("public"));
app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/FrontPage.html');
});

<<<<<<< HEAD
// Replace the existing file upload route with this
=======
// Add better logging to monitor the file deletion process
>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6
app.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) {
        console.error("No file uploaded.");
        return res.status(400).send("No file uploaded.");
    }

    const uploadedFilePath = req.file.path;
    console.log(`File uploaded to: ${uploadedFilePath}`);
    
    // After response is sent, schedule deletion
    res.on('finish', () => {
        console.log(`Scheduling deletion for: ${uploadedFilePath} in 5 seconds`);
        setTimeout(async () => {
            try {
                const absoluteFilePath = path.resolve(uploadedFilePath);
                await fsPromises.unlink(absoluteFilePath);
                console.log(`File ${absoluteFilePath} deleted successfully.`);
            } catch (error) {
                console.error(`Error deleting file ${uploadedFilePath}:`, error);
            }
        }, 5000);
    });

<<<<<<< HEAD
    try {
        // Read file content
        const fileContent = fs.readFileSync(uploadedFilePath, "utf-8");
        
        // Use the helper function to analyze code
        const content = await analyzeCodeWithGroq(fileContent, API_KEY);
        
        // Format content for file upload route (special handling for this route)
        const processedContent = content.slice(7, -3);
        
=======
    let fileContent;

    try {
        // Read file content and close the file handle immediately
        fileContent = fs.readFileSync(uploadedFilePath, "utf-8");
        
        // Process the file content...
        const prompt = `
Analyze the following code and respond with the following sections in HTML (do NOT include <html> or <body> tags):

<h2>1. Code Insights & Suggestions</h2>
- List improvements, best practices, and potential issues.

<h2>2. Cyclomatic Complexity</h2>
- Calculate the cyclomatic complexity of the code.
- Show your calculation steps.
- Explain what the result means.

<h2>3. Annotated Code</h2>
- Show the code with comments or highlights if needed.

<pre><code>
${fileContent}
</code></pre>
`;

        // Call Groq API
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Update with the correct model if needed
                messages: [
                    { role: "system", content: "You are a code analysis assistant. Always respond in HTML format (no <html> or <body> tags). Always include cyclomatic complexity with calculation steps and an explanation." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Groq API Error: ${response.status} - ${errorText}`);
            return res.status(response.status).send(`Groq API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("Unexpected Groq API response format:", data);
            return res.status(500).send("Unexpected Groq API response format.");
        }

        let content = data.choices[0].message.content;
        content = content.slice(7, -3);
        console.log("Analysis content:", content);

        // Process content to improve wrapping
        content = content
            .replace(/<pre>/g, '<pre style="white-space:pre-wrap;word-wrap:break-word;max-width:100%;">')
            .replace(/<code>/g, '<code style="white-space:pre-wrap;word-wrap:break-word;max-width:100%;">');

>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6
        // Send back the analysis result
        const safeFilePath = uploadedFilePath.replace(/\\/g, '/');
        res.send(`
            <h1>Analysis Result</h1>
<<<<<<< HEAD
            <pre>${processedContent}</pre>
=======
            <div class="analysis-content">${content}</div>
>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6
            <input type="hidden" id="uploaded-file-path" value="${safeFilePath}">
        `);
    } catch (error) {
        console.error("Error during analysis:", error);
        res.status(500).send(`Something went wrong during the analysis: ${error.message}`);
    }
});

// Update the process-files endpoint
app.post('/process-files', upload.array('files', 3), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send("No files uploaded.");
    }

    // Enforce the limit of 3 files
    if (req.files.length > 3) {
        return res.status(400).send("You can only upload up to 3 files at once.");
    }

    try {
        const results = await Promise.all(
            req.files.map(async (file) => {
                const filePath = file.path;
                const result = await processSingleFile(filePath);
                return { file: filePath, ...result };
            })
        );

        // Construct HTML to display the results
        const html = results.map(result => {
            if (result.error) {
                return `<p class="error">Error: ${result.error}</p>`;
            }
            return `
                <div class="graph-container">
                    <h3>${path.basename(result.file)}</h3>
                    <img src="data:image/png;base64,${result.image_base64}" alt="Function Graph" style="max-width:100%;"/>
                </div>
            `;
        }).join('');

        res.send(`
            <h1>Function Relationship Graphs</h1>
            <div>${html}</div>
        `);
    } catch (error) {
        console.error("Error processing files:", error);
        res.status(500).send("Error processing files.");
    }

    // Schedule deletion for all uploaded files
    res.on('finish', () => {
        req.files.forEach(file => {
            const filePath = file.path;
            console.log(`Scheduling deletion for: ${filePath} in 5 seconds`);
            
            setTimeout(async () => {
                try {
                    const absoluteFilePath = path.resolve(filePath);
                    await fsPromises.unlink(absoluteFilePath);
                    console.log(`File ${absoluteFilePath} deleted successfully.`);
                } catch (error) {
                    console.error(`Error deleting file ${filePath}:`, error);
                }
            }, 5000);
        });
    });
});

<<<<<<< HEAD

=======
// Add this function to your server.js file
>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6
async function processSingleFile(filePath) {
    return new Promise((resolve, reject) => {
        exec(`python ./public/function.py "${filePath}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error processing file ${filePath}:`, error);
                return resolve({ error: `Error processing file: ${error.message}` });
            }

            try {
                const result = JSON.parse(stdout); // Parse the JSON output from the Python script
                if (!result[0].image_base64) {
                    console.error(`Graph generation failed for file ${filePath}`);
                    return resolve({ error: `Graph generation failed for file: ${filePath}` });
                }
                resolve(result[0]); // Assuming the Python script returns an array with one object
            } catch (parseError) {
                console.error(`Error parsing output for file ${filePath}:`, parseError);
                console.error("Stdout:", stdout);
                console.error("Stderr:", stderr);
                resolve({ error: `Error parsing output: ${parseError.message}` });
            }
        });
    });
}

//from here is the process-uploaded-file route
app.get('/process-files', async (req, res) => {
    try {
        exec(`python ./public/function.py`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send(`Error processing files: ${error.message}`);
            }
            
            try {
                // Parse the JSON output from the Python script
                const image_data = JSON.parse(stdout);
                console.log("Image data:", image_data);

                // Construct HTML to display the images
                let imageTags = image_data.map(item => {
                    return `<img src="data:image/png;base64,${item.image_base64}" alt="Function Graph for ${item.file}" style="max-width:500px;">`;
                }).join('');

                console.log("Image tags:", imageTags);
                res.send(`
                    <h1>Processed Files</h1>
                    <div>${imageTags}</div>
                `);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                console.error("Stdout from Python script:", stdout);
                console.error("Stderr from Python script:", stderr);
                return res.status(500).send(`Error parsing JSON: ${parseError.message}`);
            }
        });
    } catch (error) {
        console.error("Error processing files:", error);
        res.status(500).send(`Error processing files: ${error.message}`);
    }
});

// Update the process-uploaded-file route:

app.get('/process-uploaded-file', async (req, res) => {
    const filePath = req.query.path;
    
    if (!filePath) {
        return res.status(400).send("No file path provided");
    }
    
    // Handle different potential path formats
    // This normalizes paths with different delimiters
    let normalizedPath = filePath
        .replace(/\|/g, '/') // Replace pipe characters with forward slashes
        .replace(/\\/g, '/'); // Replace backslashes with forward slashes
    
    // Ensure the path is relative to the project root
    if (!normalizedPath.startsWith('uploads/')) {
        normalizedPath = path.join('uploads', path.basename(normalizedPath));
    }
    
    try {
        const fileExists = fs.existsSync(normalizedPath);
        
        if (!fileExists) {
            // Try to find the file by listing the uploads directory
            const files = fs.readdirSync('uploads');
            
            // Look for a file with a matching basename
            const baseName = path.basename(normalizedPath);
            const matchingFile = files.find(f => f.includes(baseName.split('-').pop()));
            
            if (matchingFile) {
                normalizedPath = path.join('uploads', matchingFile);
            }
        }
        
        // Execute the Python script with the normalized path
        exec(`python ./public/function.py "${normalizedPath}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error:`, error);
                return res.status(500).send(`Error processing file: ${error.message}`);
            }
            
            try {
                const image_data = JSON.parse(stdout);
                
                // Construct HTML to display the images
                let imageTags = image_data.map(item => {
                    if (item.error) {
                        return `<p class="error">Error: ${item.error}</p>`;
                    }
                    return `<div class="graph-container">
                              <h3>${path.basename(item.file)}</h3>
                              <img src="data:image/png;base64,${item.image_base64}" alt="Function Graph" style="max-width:100%;">
                            </div>`;
                }).join('');
                
                res.send(`
                    <h1>Function Relationship Graph</h1>
                    <div>${imageTags}</div>
                `);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                return res.status(500).send(`Error parsing JSON: ${parseError.message}`);
            }
        });
    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).send(`Error processing file: ${error.message}`);
    }
});

<<<<<<< HEAD

app.post('/groq/analyze', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages) {
      return res.status(400).json({ error: 'No message provided for analysis' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    // Updated prompt to explicitly ask for positive, neutral, or negative classification
    const prompt = `Analyze the sentiment of the following git commit message. 
    Classify it as ONLY ONE of these three categories: positive, neutral, or negative.
    Be clear which category you've selected, and briefly explain why:
    
    "${messages}"`;

    // Log that we're calling Groq API for debugging
    console.log(`Calling Groq API for message: "${messages.substring(0, 30)}..."`);

    // Call Groq API
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-70b-8192', 
      messages: [
        { role: 'system', content: 'You are a helpful assistant that analyzes the sentiment of git commit messages. Always classify as positive, neutral, or negative - never mixed or other categories.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent classification
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Groq API response received');
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Groq API:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to analyze with Groq API',
      details: error.response?.data || error.message
    });
  }
});

// Add weather endpoint to fetch data for a single date
app.get('/weather', async (req, res) => {
  try {
    const { date, lat, lon } = req.query;
    
    if (!date || !lat || !lon) {
      return res.status(400).json({ error: 'Missing required parameters: date, lat, lon' });
    }
    
    const meteostatApiKey = process.env.meteostat_key;
    
    if (!meteostatApiKey) {
      return res.status(500).json({ error: 'Meteostat API key not configured' });
    }
    
    // Call Meteostat API via RapidAPI
    const response = await axios.get(`https://meteostat.p.rapidapi.com/point/daily`, {
      params: {
        lat,
        lon,
        start: date,
        end: date
      },
      headers: {
        'X-RapidAPI-Key': meteostatApiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.response?.data || error.message
    });
  }
});

// Add endpoint for weather range data
app.get('/weather/range', async (req, res) => {
  try {
    const { start, end, lat, lon } = req.query;
    
    if (!start || !end || !lat || !lon) {
      return res.status(400).json({ error: 'Missing required parameters: start, end, lat, lon' });
    }
    
    const meteostatApiKey = process.env.meteostat_key;
    
    if (!meteostatApiKey) {
      return res.status(500).json({ error: 'Meteostat API key not configured' });
    }
    
    // Call Meteostat API via RapidAPI
    const response = await axios.get(`https://meteostat.p.rapidapi.com/point/daily`, {
      params: {
        lat,
        lon,
        start,
        end
      },
      headers: {
        'X-RapidAPI-Key': meteostatApiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather range data:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.response?.data || error.message
    });
  }
});

// Add weather endpoint for station data (single date)
app.get('/weather/station', async (req, res) => {
  try {
    const { date, station } = req.query;
    
    if (!date || !station) {
      return res.status(400).json({ error: 'Missing required parameters: date, station' });
    }
    
    const meteostatApiKey = process.env.meteostat_key;
    
    if (!meteostatApiKey) {
      return res.status(500).json({ error: 'Meteostat API key not configured' });
    }
    
    // Call Meteostat API via RapidAPI for station data
    const response = await axios.get(`https://meteostat.p.rapidapi.com/stations/daily`, {
      params: {
        station,
        start: date,
        end: date
      },
      headers: {
        'X-RapidAPI-Key': meteostatApiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching station weather data:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.response?.data || error.message
    });
  }
});

// Add endpoint for station weather range data
app.get('/weather/station/range', async (req, res) => {
  try {
    const { start, end, station } = req.query;
    
    if (!start || !end || !station) {
      return res.status(400).json({ error: 'Missing required parameters: start, end, station' });
    }
    
    const meteostatApiKey = process.env.meteostat_key;
    
    if (!meteostatApiKey) {
      return res.status(500).json({ error: 'Meteostat API key not configured' });
    }
    
    // Call Meteostat API via RapidAPI for station data
    const response = await axios.get(`https://meteostat.p.rapidapi.com/stations/daily`, {
      params: {
        station,
        start,
        end
      },
      headers: {
        'X-RapidAPI-Key': meteostatApiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching station weather range data:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.response?.data || error.message
    });
  }
});

// Add weather endpoint for station hourly data (single date)
app.get('/weather/station/hourly', async (req, res) => {
  try {
    const { date, station } = req.query;
    if (!date || !station) {
      return res.status(400).json({ error: 'Missing required parameters: date, station' });
    }
    const meteostatApiKey = process.env.meteostat_key;
    if (!meteostatApiKey) {
      return res.status(500).json({ error: 'Meteostat API key not configured' });
    }
    // Call Meteostat API via RapidAPI for station hourly data
    const response = await axios.get(`https://meteostat.p.rapidapi.com/stations/hourly`, {
      params: {
        station,
        start: date,
        end: date
      },
      headers: {
        'X-RapidAPI-Key': meteostatApiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching station hourly weather data:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      details: error.response?.data || error.message
    });
  }
});

// Replace the existing analyze route with this
app.post('/analyze', async (req, res) => {
    try {
        const { code } = req.body;
        
        // Use the helper function to analyze code
        const content = await analyzeCodeWithGroq(code, process.env.GROQ_API_KEY);
        
        // Format the response
        res.send(`
            <h1>Analysis Result</h1>
            <div class="analysis-content">${content}</div>
        `);
    } catch (error) {
        console.error("Error analyzing code:", error);
        res.status(500).send(`<h1>Error</h1><p>Something went wrong during the analysis: ${error.message}</p>`);
    }
});


async function analyzeCodeWithGroq(code, apiKey) {
    if (!code) {
        throw new Error("No code provided for analysis");
    }

=======
// Handle the /analyze route with code input as raw JSON
app.post('/analyze', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        console.error("No code provided.");
        return res.status(400).send('No code provided.');
    }

    console.log("Code received:", code);  // Log the code received

>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6
    const prompt = `Analyze the following code and provide insights or suggestions for improvement AND show me the complexity of the code with cyclomatic complexity, how you got the answer to it, and what it means. Provide the response in HTML Formatting, make sure not to include <html>:
    \`\`\`
    ${code}
    \`\`\`
    `;

    // Call Groq API
<<<<<<< HEAD
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
                { role: "system", content: "You are a helpful assistant that analyzes code." },
                { role: "user", content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Unexpected Groq API response format");
    }

    return data.choices[0].message.content;
}


app.get('/api/github-token', (req, res) => {
  // In a production environment, you would add authentication here
  // to ensure only authorized users can access the token
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }
  res.json({ token: githubToken });
});

=======
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Update with the correct model if needed
                messages: [
                    { role: "system", content: "You are a code analysis assistant. Always respond in HTML format (no <html> or <body> tags). Always include cyclomatic complexity with calculation steps and an explanation." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Groq API Error: ${response.status} - ${errorText}`);
            return res.status(response.status).send(`Groq API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("Unexpected Groq API response format:", data);
            return res.status(500).send("Unexpected Groq API response format.");
        }

        let content = data.choices[0].message.content;
        content = content.slice(7, -3);  // Clean up the response

        console.log("Analysis content:", content);

        // Process content to improve wrapping
        content = content
            .replace(/<pre>/g, '<pre style="white-space:pre-wrap;word-wrap:break-word;max-width:100%;">')
            .replace(/<code>/g, '<code style="white-space:pre-wrap;word-wrap:break-word;max-width:100%;">');

        // Send back the analysis result
        res.send(`
            <h1>Analysis Result</h1>
            <div class="analysis-content">${content}</div>
        `);

    } catch (error) {
        console.error("Error during analysis:", error);
        res.status(500).send("Something went wrong during the analysis.");
    }
});


const GROQ_API_KEY = process.env.GROQ_API_KEY; // Use environment variable for Groq API key

app.use(express.static("public"));
app.use(express.json());

async function fetchGroqAnalysis(messages) {
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that summarizes GitHub commits and its sentiment.' },
                    { role: 'user', content: `Analyze the following GitHub commit messages and provide a 4 line summary on the developers mood and sentiment based on the comments and commits, also calculate and provide a score for the sentiment, Like (Positive: 0-100%, Neutral: 0-100%, Negative: 0-100%): (ONLY PRINT THE ANALYSIS AND SCORE, NOTHING EXTRA)\n\n${messages}` }
                ],
                max_tokens: 500,
                temperature: 0.5
            },
            {
                headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Groq analysis:", error);
        throw error;
    }
}

app.post("/groq/analyze", async (req, res) => {
    const { messages } = req.body; // Expecting commit messages in the request body
    if (!messages) {
        return res.status(400).json({ error: "Messages are required for analysis." });
    }

    try {
        const groqResponse = await fetchGroqAnalysis(messages);
        res.json(groqResponse);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch Groq analysis." });
    }
});

async function analyzeGithubCommits(owner = 'vatsalr26', repo = 'CAPSTONER', maxCommits = 5) {
    const url = GITHUB_API_URL.replace("{owner}", owner).replace("{repo}", repo);
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        if (!response.ok) {
            console.log("Error fetching commits:", response.status);
            return [];
        }

        const commits = await response.json();
        const analysisResults = [];

        for (const commit of commits.slice(0, maxCommits)) {
            const commitMessage = commit.commit.message;
            const commitDate = commit.commit.author.date;
            const commitAuthor = commit.commit.author.name;

            const commitAnalysis = {
                author: commitAuthor,
                date: commitDate,
                commitMessage: commitMessage,
                codeComments: [] // Placeholder for code comments if needed
            };

            const commitUrl = commit.url + "/files";
            const diffResponse = await fetch(commitUrl, {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
            });

            if (diffResponse.ok) {
                const diffData = await diffResponse.json();
                diffData.forEach(file => {
                    // Code comments analysis can be added here if needed
                });
            }

            analysisResults.push(commitAnalysis);
        }

        return analysisResults;
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

app.get("/analyze/:owner/:repo", async (req, res) => {
    const { owner, repo } = req.params;
    try {
        const analysisResults = await analyzeGithubCommits(owner, repo);
        res.json(analysisResults);
    } catch (error) {
        console.error("Error analyzing GitHub commits:", error);
        res.status(500).json({ error: "Failed to analyze GitHub commits." });
    }
});
import dayjs from 'dayjs';
import { Meteostat } from 'meteostat';

dotenv.config();


const sonarKey = process.env.sonar_key;
const githubKey = process.env.github_key;  // GitHub token
const groqApiKey = process.env.groq_api_key;
const meteostat = new Meteostat(process.env.meteostat_key);

// Middleware to serve static files like styles.css
app.use(express.static('public'));

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

// === Fetch GitHub Commits ===
async function getCommits(owner, repo, sinceDate) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
    console.log("GitHub Token:", githubKey);  // Log token to ensure it's being loaded correctly
    try {
        const response = await axios.get(url, {
            params: { since: sinceDate, per_page: 5 },
            headers: { Authorization: `token ${githubKey}` }  // Properly add token to header
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching GitHub commits:', error.message);
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

// === Analyze Sonar Issues with Groq ===
async function analyzeWithGroq(promptText) {
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'mixtral-8x7b-32768',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that summarizes SonarQube issues and predict the mood of the developer.' },
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

// === Analyze GitHub Commits with Groq ===
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
                    { role: 'system', content: 'You are a helpful assistant that summarizes GitHub commits.' },
                    { role: 'user', content: `Analyze the following GitHub commit messages and provide a summary:\n\n${messages}` }
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

// === API Routes for Frontend ===

// Serve Sonar issues along with weather and GitHub commits
app.get('/api/sonar-issues', async (req, res) => {
    try {
        const sonarIssues = await getSonarStuff(sonarKey);
        const weatherData = [];
        const githubCommits = await getCommits('KALalev18', 'Capstone-Project', '2025-01-01T00:00:00Z');

        // Ensure commits are fetched properly
        if (githubCommits.length === 0) {
            console.log("No GitHub commits found.");
        } else {
            console.log(`Fetched ${githubCommits.length} GitHub commits.`);
        }

        for (let issue of sonarIssues) {
            const weather = await getWeather(issue.creationDate.slice(0, 10));
            weatherData.push(weather);
        }

        // Ensure that GitHub commits are always returned even if none are found
        if (!githubCommits || githubCommits.length === 0) {
            githubCommits.push({
                commit: { author: { name: 'No commits', date: '' }, message: 'No commits available' }
            });
        }

        res.json({
            sonarIssues,
            weatherData,
            githubCommits  // Send GitHub commits along with other data
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching SonarQube data' });
    }
});

// Serve Commit analysis
app.get('/api/commit-analysis', async (req, res) => {
    try {
        const githubCommits = await getCommits('KALalev18', 'Capstone-Project', '2025-01-01T00:00:00Z');
        const commitAnalysis = await analyzeCommits(githubCommits);
        res.json({ commitAnalysis });
    } catch (error) {
        res.status(500).json({ error: 'Error analyzing GitHub commits' });
    }
});

// Serve Sonar analysis
app.get('/api/sonar-analysis', async (req, res) => {
    try {
        const sonarIssues = await getSonarStuff(sonarKey);
        const issueSummary = sonarIssues.map((issue, i) =>
            `Issue ${i + 1}: ${issue.message} | Severity: ${issue.severity} | Date: ${issue.creationDate}` 
        ).join('\n');
        const sonarAnalysis = await analyzeWithGroq(issueSummary);
        res.json({ sonarAnalysis });
    } catch (error) {
        res.status(500).json({ error: 'Error analyzing SonarQube issues' });
    }
});

// Serve static files like styles.css and index.html
app.use(express.static('public'));

>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6
// Start the server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
