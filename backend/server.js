import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Automatically loads environment variables from .env file

import connectDB from './config/db.js'; // Note: You MUST include the '.js' extension here!
import authRoutes from './routes/authentication/authRoutes.js'
import userRoutes from './routes/user/userRoutes.js'
import adminRoutes from './routes/admin/adminRoutes.js'
import volunteerRoutes from './routes/volunteer/volunteerRoutes.js'

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Base test route
app.get('/', (req, res) => {
    res.send('Mind-Matter API is running successfully!');
});

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/volunteer', volunteerRoutes)

app.use('/api', (req, res) => {
    res.status(404).json({
        message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Start the server only after the database is available.
await connectDB();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running actively on port ${PORT}`);
    console.log(`[Server] URL: http://localhost:${PORT}`);
});
