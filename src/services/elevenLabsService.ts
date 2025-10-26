/**
 * ElevenLabs Service - Now calls backend API instead of directly calling ElevenLabs
 */
import { apiClient } from './apiClient';

export type AudioResult = {
  audioBlob: Blob;
  duration: number;
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
  
  try {
    const data = await apiClient.post<{
      audioBase64: string;
      totalDuration: number;
      segments: Array<{
        startTime: number;
        endTime: number;
        duration: number;
      }>;
    }>('/voiceover/generate', {
      scripts
    });
    
    // Convert base64 audio back to Blob
    const binaryString = atob(data.audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
    
    // Get actual duration from audio
    const actualDuration = await getActualAudioDuration(audioBlob);
    
    console.timeEnd('⏱️ Combined Voiceover API Call');
    
    return {
      audioBlob,
      totalDuration: actualDuration,
      segments: data.segments
    };
  } catch (error) {
    console.error('Error generating combined voiceover:', error);
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

