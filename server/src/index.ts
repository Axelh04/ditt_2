import dotenv from 'dotenv';
// Load environment variables FIRST before importing anything else
dotenv.config();

import express from 'express';
import cors from 'cors';
import { processRouter } from './routes/process.js';
import { voiceoverRouter } from './routes/voiceover.js';
import { quizRouter } from './routes/quiz.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins in development
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/process', processRouter);
app.use('/api/voiceover', voiceoverRouter);
app.use('/api/quiz', quizRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

