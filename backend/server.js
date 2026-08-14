import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Automatically loads environment variables from .env file

import connectDB from './config/db.js'; // Note: You MUST include the '.js' extension here!

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Base test route
app.get('/', (req, res) => {
    res.send('Mind-Matter API is running successfully!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`[Server] Running actively on port ${PORT}`);
    console.log(`[Server] URL: http://localhost:${PORT}`);
});
