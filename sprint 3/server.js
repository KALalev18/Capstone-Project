import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import fs, { promises as fsPromises } from 'fs';

dotenv.config();
const app = express();

app.use(express.json());  // This enables parsing of JSON request bodies

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

app.get('/', (req, res) => {
  res.redirect('/FrontPage.html');
});

// Add better logging to monitor the file deletion process
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

        // Send back the analysis result
        const safeFilePath = uploadedFilePath.replace(/\\/g, '/');
        res.send(`
            <h1>Analysis Result</h1>
            <div class="analysis-content">${content}</div>
            <input type="hidden" id="uploaded-file-path" value="${safeFilePath}">
        `);
    } catch (error) {
        console.error("Error during analysis:", error);
        res.status(500).send("Something went wrong during the analysis.");
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

// Add this function to your server.js file
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

// Handle the /analyze route with code input as raw JSON
app.post('/analyze', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        console.error("No code provided.");
        return res.status(400).send('No code provided.');
    }

    console.log("Code received:", code);  // Log the code received

    const prompt = `Analyze the following code and provide insights or suggestions for improvement AND show me the complexity of the code with cyclomatic complexity, how you got the answer to it, and what it means. Provide the response in HTML Formatting, make sure not to include <html>:
    \`\`\`
    ${code}
    \`\`\`
    `;

    // Call Groq API
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

// Start the server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
