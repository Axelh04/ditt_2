import axios from 'axios';
import { ApiError } from '../middleware/errorHandler.js';

const HUME_AI_API_URL = 'https://api.hume.ai/v0/tts';

function getHumeApiKey(): string {
  const apiKey = process.env.HUME_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'HUME_API_KEY environment variable is not set');
  }
  return apiKey;
}

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
 * Generates a single voiceover for multiple scripts and calculates time segments for each
 */
export async function generateCombinedVoiceover(scripts: string[]): Promise<CombinedAudioResult> {
  console.time('⏱️ Combined Voiceover API Call');
  
  try {
    console.log(`🎤 Generating voiceover with Hume AI for ${scripts.length} scripts`)
    
    // Create utterances with trailing silence for pauses between stages
    const utterances = scripts.map((script, index) => ({
      text: script,
      trailing_silence: index < scripts.length - 1 ? 0.5 : 0 // 0.5 second pause between stages
    }));
    
    const response = await axios.post(
      HUME_AI_API_URL,
      {
        utterances,
        format: { type: 'mp3' }
        // Using Octave 1 (default) - no voice parameter needed
      },
      {
        headers: {
          'X-Hume-Api-Key': getHumeApiKey(),
          'Content-Type': 'application/json',
        }
      }
    );

    // Hume AI returns JSON with base64 audio
    const generation = response.data.generations[0];
    const audioBase64 = generation.audio;
    const totalDuration = generation.duration; // Duration in seconds
    
    console.log(`✅ Generated audio: ${totalDuration.toFixed(2)}s`);
    console.timeEnd('⏱️ Combined Voiceover API Call');
    
    // Calculate time segments based on snippet timestamps
    const segments: AudioSegment[] = [];
    const snippets = generation.snippets;
    
    if (snippets && snippets.length > 0) {
      // Use actual snippet timestamps from Hume AI
      snippets.forEach((utteranceSnippets: any[], index: number) => {
        if (utteranceSnippets.length > 0) {
          const firstSnippet = utteranceSnippets[0];
          const lastSnippet = utteranceSnippets[utteranceSnippets.length - 1];
          
          // Get start time from first snippet's first timestamp
          const startTime = firstSnippet.timestamps.length > 0 
            ? firstSnippet.timestamps[0].time.begin / 1000 // Convert ms to seconds
            : 0;
          
          // Get end time from last snippet's last timestamp
          const endTime = lastSnippet.timestamps.length > 0
            ? lastSnippet.timestamps[lastSnippet.timestamps.length - 1].time.end / 1000
            : startTime;
          
          segments.push({
            startTime,
            endTime,
            duration: endTime - startTime
          });
        }
      });
    } else {
      // Fallback: estimate segments based on word count proportions
      const wordCounts = scripts.map(script => script.split(/\s+/).length);
      const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
      const pauseDuration = 0.5;
      const totalPauseDuration = pauseDuration * (scripts.length - 1);
      const speakingDuration = totalDuration - totalPauseDuration;
      
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
    }
    
    console.log('📊 Audio segments:', segments.map((seg, i) => 
      `Stage ${i + 1}: ${seg.startTime.toFixed(2)}s - ${seg.endTime.toFixed(2)}s (${seg.duration.toFixed(2)}s)`
    ));
    
    return {
      audioBase64,
      totalDuration,
      segments
    };
  } catch (error: any) {
    console.error('Error generating combined voiceover:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      const errorMessage = errorData?.detail || errorData?.message || error.message;
      
      console.error('❌ Hume AI API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        message: errorMessage,
        data: errorData
      });
      
      throw new ApiError(
        error.response.status || 500,
        `Hume AI API error (${error.response.status}): ${errorMessage}`
      );
    }
    
    throw new ApiError(500, `Failed to generate voiceover: ${error.message}`);
  }
}

