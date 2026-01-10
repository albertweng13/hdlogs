import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes (must be before static middleware to ensure proper routing)
app.use('/api', routes);

// Static file serving (after API routes to avoid conflicts)
app.use(express.static('src/frontend'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'src/frontend' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

