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

// Validate environment variables on startup
console.log('🔍 Checking environment variables...');
const hasGemini = !!process.env.GEMINI_API_KEY;
const hasHume = !!process.env.HUME_API_KEY;
console.log(`  GEMINI_API_KEY: ${hasGemini ? '✅ Set' : '❌ Missing'}`);
console.log(`  HUME_API_KEY: ${hasHume ? '✅ Set' : '❌ Missing'}`);
if (!hasGemini || !hasHume) {
  console.warn('⚠️  Server will start but API calls will fail without valid keys!');
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins in development
    if (!origin || origin.startsWith('http://localhost:') || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else if (process.env.CORS_ORIGIN) {
      // Production: only allow specified origin
      callback(null, process.env.CORS_ORIGIN === origin);
    } else {
      callback(null, true);
    }
  },
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
  console.log(`📡 CORS enabled for: All localhost origins in development`);
});

