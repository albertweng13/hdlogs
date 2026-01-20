import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes (must be before static middleware to ensure proper routing)
app.use('/api', routes);

// Static file serving (after API routes to avoid conflicts)
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve utils directory for frontend imports (use absolute path)
app.use('/utils', express.static(path.join(__dirname, '../utils')));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../frontend') });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

