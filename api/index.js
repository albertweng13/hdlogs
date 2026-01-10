// Vercel serverless function entry point
// This exports the Express app for Vercel's serverless environment

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from '../src/api/routes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', routes);

// Export the app for Vercel serverless functions
// Note: Static file serving is handled by Vercel's rewrites in vercel.json
export default app;

