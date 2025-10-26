import { Router, Request, Response, NextFunction } from 'express';
import { generateProcessSVGs } from '../services/geminiService.js';
import { ApiError } from '../middleware/errorHandler.js';

export const processRouter = Router();

/**
 * POST /api/process/generate
 * Generate process breakdown with SVG stages
 */
processRouter.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new ApiError(400, 'Query parameter is required and must be a non-empty string');
    }

    if (query.length > 500) {
      throw new ApiError(400, 'Query must be less than 500 characters');
    }

    console.log(`🔍 Generating process for query: "${query}"`);
    
    const processData = await generateProcessSVGs(query.trim());
    
    res.json(processData);
  } catch (error) {
    next(error);
  }
});

