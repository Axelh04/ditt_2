import axios from 'axios';

const ELEVEN_LABS_API_KEY = 'sk_5e5ecb5b4e444ac5537d7c13575ff8d40c5230c2e2792868';
const ELEVEN_LABS_API_URL = import.meta.env.DEV
  ? '/api/elevenlabs/v1'
  : 'https://api.elevenlabs.io/v1';

// Using a default voice ID (Rachel - a pleasant female voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export type AudioResult = {
  audioBlob: Blob;
  duration: number; // estimated duration in seconds
}

export async function generateVoiceover(text: string): Promise<AudioResult> {
  try {
    console.log(`📊 Generating voiceover for ${text.length} characters (~${text.length} credits)`);
    
    const response = await axios.post(
      `${ELEVEN_LABS_API_URL}/text-to-speech/${DEFAULT_VOICE_ID}`,
      {
        text: text,
        model_id: 'eleven_turbo_v2_5', // Much cheaper and faster than v1
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

    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    
    // Estimate duration (rough estimate: ~150 words per minute, ~5 characters per word)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60; // in seconds
    
    return {
      audioBlob,
      duration: estimatedDuration
    };
  } catch (error) {
    console.error('Error generating voiceover:', error);
    throw error;
  }
}

export async function getActualAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio'));
    });
    
    audio.src = url;
  });
}

export type CombinedAudioResult = {
  audioBlob: Blob;
  totalDuration: number;
  segments: Array<{
    startTime: number;
    endTime: number;
    duration: number;
  }>;
}

/**
 * Generates a single voiceover for multiple scripts and calculates time segments for each
 */
export async function generateCombinedVoiceover(scripts: string[]): Promise<CombinedAudioResult> {
  console.time('⏱️ Combined Voiceover API Call');
  console.log('🚀 API CALL #' + (window as any).__apiCallCount || 1);
  (window as any).__apiCallCount = ((window as any).__apiCallCount || 0) + 1;
  
  try {
    // Combine scripts with pauses between them
    // Using periods and line breaks creates natural pauses in speech
    const combinedText = scripts.join('... ... '); // Triple dots create a pause
    
    // Log character count for credit tracking
    console.log(`📊 Generating voiceover for ${combinedText.length} characters (~${combinedText.length} credits)`)
    
    const response = await axios.post(
      `${ELEVEN_LABS_API_URL}/text-to-speech/${DEFAULT_VOICE_ID}`,
      {
        text: combinedText,
        model_id: 'eleven_turbo_v2_5', // Much cheaper and faster than v1
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

    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    const totalDuration = await getActualAudioDuration(audioBlob);
    
    console.timeEnd('⏱️ Combined Voiceover API Call');
    
    // Calculate time segments based on word count proportions
    const wordCounts = scripts.map(script => script.split(/\s+/).length);
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    
    // Add a small pause duration between segments (estimate ~0.5 seconds per pause)
    const pauseDuration = 0.5;
    const totalPauseDuration = pauseDuration * (scripts.length - 1);
    const speakingDuration = totalDuration - totalPauseDuration;
    
    const segments: Array<{ startTime: number; endTime: number; duration: number }> = [];
    let currentTime = 0;
    
    wordCounts.forEach((wordCount, index) => {
      const segmentDuration = (wordCount / totalWords) * speakingDuration;
      segments.push({
        startTime: currentTime,
        endTime: currentTime + segmentDuration,
        duration: segmentDuration
      });
      currentTime += segmentDuration;
      
      // Add pause time before next segment (except after the last one)
      if (index < scripts.length - 1) {
        currentTime += pauseDuration;
      }
    });
    
    console.log('📊 Audio segments:', segments.map((seg, i) => 
      `Stage ${i + 1}: ${seg.startTime.toFixed(2)}s - ${seg.endTime.toFixed(2)}s (${seg.duration.toFixed(2)}s)`
    ));
    
    console.log(`💰 Total credits used: ~${combinedText.length} (${scripts.length} stages combined)`);
    
    return {
      audioBlob,
      totalDuration,
      segments
    };
  } catch (error) {
    console.error('Error generating combined voiceover:', error);
    throw error;
  }
}

