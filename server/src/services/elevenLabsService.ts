import axios from 'axios';
import { ApiError } from '../middleware/errorHandler.js';

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

if (!ELEVEN_LABS_API_KEY) {
  throw new Error('ELEVEN_LABS_API_KEY environment variable is not set');
}

// Using a default voice ID (Rachel - a pleasant female voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export type AudioSegment = {
  startTime: number;
  endTime: number;
  duration: number;
}

export type CombinedAudioResult = {
  audioBase64: string; // Base64 encoded audio for easier JSON transmission
  totalDuration: number;
  segments: AudioSegment[];
}

/**
 * Get actual audio duration by creating a temporary audio context
 * This runs on the server side using a simpler estimation
 */
function estimateAudioDuration(audioBuffer: Buffer, wordCount: number): number {
  // MP3 typically has ~150 words per minute
  // More accurate: use file size and bitrate
  // For now, use word count estimation
  return (wordCount / 150) * 60;
}

/**
 * Generates a single voiceover for multiple scripts and calculates time segments for each
 */
export async function generateCombinedVoiceover(scripts: string[]): Promise<CombinedAudioResult> {
  console.time('⏱️ Combined Voiceover API Call');
  
  try {
    // Combine scripts with pauses between them
    const combinedText = scripts.join('... ... '); // Triple dots create a pause
    
    console.log(`📊 Generating voiceover for ${combinedText.length} characters (~${combinedText.length} credits)`)
    
    const response = await axios.post(
      `${ELEVEN_LABS_API_URL}/text-to-speech/${DEFAULT_VOICE_ID}`,
      {
        text: combinedText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVEN_LABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );

    const audioBuffer = Buffer.from(response.data);
    
    // Convert to base64 for JSON transmission
    const audioBase64 = audioBuffer.toString('base64');
    
    // Calculate duration estimate
    const wordCounts = scripts.map(script => script.split(/\s+/).length);
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    const totalDuration = estimateAudioDuration(audioBuffer, totalWords);
    
    console.timeEnd('⏱️ Combined Voiceover API Call');
    
    // Calculate time segments based on word count proportions
    const pauseDuration = 0.5;
    const totalPauseDuration = pauseDuration * (scripts.length - 1);
    const speakingDuration = totalDuration - totalPauseDuration;
    
    const segments: AudioSegment[] = [];
    let currentTime = 0;
    
    wordCounts.forEach((wordCount, index) => {
      const segmentDuration = (wordCount / totalWords) * speakingDuration;
      segments.push({
        startTime: currentTime,
        endTime: currentTime + segmentDuration,
        duration: segmentDuration
      });
      currentTime += segmentDuration;
      
      if (index < scripts.length - 1) {
        currentTime += pauseDuration;
      }
    });
    
    console.log('📊 Audio segments:', segments.map((seg, i) => 
      `Stage ${i + 1}: ${seg.startTime.toFixed(2)}s - ${seg.endTime.toFixed(2)}s (${seg.duration.toFixed(2)}s)`
    ));
    
    console.log(`💰 Total credits used: ~${combinedText.length} (${scripts.length} stages combined)`);
    
    return {
      audioBase64,
      totalDuration,
      segments
    };
  } catch (error: any) {
    console.error('Error generating combined voiceover:', error);
    
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        error.response?.status || 500,
        `ElevenLabs API error: ${error.response?.data?.message || error.message}`
      );
    }
    
    throw new ApiError(500, `Failed to generate voiceover: ${error.message}`);
  }
}

