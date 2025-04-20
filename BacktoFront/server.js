import express from 'express';
import { getAnalysisData } from './ai3.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/data', async (req, res) => {
    try {
        console.log("Fetching analysis data...");
        const data = await getAnalysisData();
        
        if (!data || Object.keys(data).length === 0) {
            return res.status(200).json({
                status: 'success',
                message: "No data available",
                data: []
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: data
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});