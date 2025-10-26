import { Router, Request, Response, NextFunction } from 'express';
import { generateCombinedVoiceover } from '../services/elevenLabsService.js';
import { ApiError } from '../middleware/errorHandler.js';

export const voiceoverRouter = Router();

/**
 * POST /api/voiceover/generate
 * Generate combined voiceover for multiple scripts
 */
voiceoverRouter.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scripts } = req.body;

    if (!Array.isArray(scripts) || scripts.length === 0) {
      throw new ApiError(400, 'Scripts must be a non-empty array');
    }

    if (scripts.some(script => typeof script !== 'string' || script.trim().length === 0)) {
      throw new ApiError(400, 'All scripts must be non-empty strings');
    }

    if (scripts.length > 10) {
      throw new ApiError(400, 'Maximum 10 scripts allowed');
    }

    console.log(`🎤 Generating voiceover for ${scripts.length} scripts`);
    
    const audioResult = await generateCombinedVoiceover(scripts);
    
    res.json(audioResult);
  } catch (error) {
    next(error);
  }
});

