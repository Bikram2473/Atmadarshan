import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './db.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import circularsRoutes from './routes/circulars.js';
import classesRoutes from './routes/classes.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import bugsRoutes from './routes/bugs.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Express CORS setup
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        process.env.CLIENT_URL
    ].filter(Boolean), // Remove undefined/null values
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/circulars', circularsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bugs', bugsRoutes);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
connectDB().then(() => {
    // Listen on 0.0.0.0 to accept IPv4 connections explicitly
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
