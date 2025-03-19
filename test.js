import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

const API_KEY = process.env.GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions"; 

app.use(express.static("public"));

app.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    try {
        const fs = await import('fs');
        const fileContent = fs.readFileSync(req.file.path, "utf-8");

        const prompt = `Analyze the following code and provide insights or suggestions for improvement AND show me the complexity of the code with cyclomatic complexity, how you got the answer to it, and what it means. Provide the response in HTML Formatting, make sure not to include <html>:
        \`\`\`
        ${fileContent}
        \`\`\`
        `;

        // Call Groq API
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "qwen-2.5-coder-32b", // Update with the correct model if needed
                messages: [
                    { role: "system", content: "You are a helpful assistant that analyzes code." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        const data = await response.json();
        let content = data.choices[0].message.content;
        content = content.slice(7, -3);
        console.log(content);
       
        // Send back the analysis result
        res.send(`
            <h1>Analysis Result</h1>
            <pre>${content}</pre>
        `);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Something went wrong.");
    }
});

// Start the server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
