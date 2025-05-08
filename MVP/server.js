import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import fs, { promises as fsPromises } from 'fs';
import axios from 'axios';

dotenv.config();
const app = express();

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

// Replace the existing file upload route with this
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

    try {
        // Read file content
        const fileContent = fs.readFileSync(uploadedFilePath, "utf-8");
        
        // Use the helper function to analyze code
        const content = await analyzeCodeWithGroq(fileContent, API_KEY);
        
        // Format content for file upload route (special handling for this route)
        const processedContent = content.slice(7, -3);
        
        // Send back the analysis result
        const safeFilePath = uploadedFilePath.replace(/\\/g, '/');
        res.send(`
            <h1>Analysis Result</h1>
            <pre>${processedContent}</pre>
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

    //this is something new

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

    const prompt = `Analyze the following code and provide insights or suggestions for improvement AND show me the complexity of the code with cyclomatic complexity, how you got the answer to it, and what it means. Provide the response in HTML Formatting, make sure not to include <html>:
    \`\`\`
    ${code}
    \`\`\`
    `;

    // Call Groq API
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

// Start the server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
