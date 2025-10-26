import { Router, Request, Response, NextFunction } from 'express';
import { generateQuiz, type ProcessBreakdown } from '../services/geminiService.js';
import { ApiError } from '../middleware/errorHandler.js';

export const quizRouter = Router();

/**
 * POST /api/quiz/generate
 * Generate quiz questions for a process
 */
quizRouter.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { processData } = req.body;

    if (!processData || typeof processData !== 'object') {
      throw new ApiError(400, 'processData is required and must be an object');
    }

    if (!processData.processName || !Array.isArray(processData.stages)) {
      throw new ApiError(400, 'Invalid processData structure');
    }

    console.log(`📝 Generating quiz for process: "${processData.processName}"`);
    
    const quizData = await generateQuiz(processData as ProcessBreakdown);
    
    res.json(quizData);
  } catch (error) {
    next(error);
  }
});

