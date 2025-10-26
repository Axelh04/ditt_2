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
    }>('/api/voiceover/generate', {
      scripts
    });
    
    // Convert base64 audio back to Blob
    const binaryString = atob(data.audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
    
    // Get actual duration from audio file (more accurate than backend estimate)
    const actualDuration = await getActualAudioDuration(audioBlob);
    
    console.timeEnd('⏱️ Combined Voiceover API Call');
    
    // Recalculate segments based on ACTUAL duration (not backend estimate)
    // Distribute time proportionally by word count (includes natural pauses)
    const wordCounts = scripts.map(script => script.split(/\s+/).length);
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    
    const segments: Array<{ startTime: number; endTime: number; duration: number }> = [];
    let currentTime = 0;
    
    // Simple proportional distribution - no manual pause calculation
    // The pauses from "... ... " are already in the audio
    wordCounts.forEach((wordCount, index) => {
      const segmentDuration = (wordCount / totalWords) * actualDuration;
      segments.push({
        startTime: currentTime,
        endTime: currentTime + segmentDuration,
        duration: segmentDuration
      });
      currentTime += segmentDuration;
    });
    
    console.log('📊 Audio segments:', segments.map((seg, i) => 
      `Stage ${i + 1}: ${seg.startTime.toFixed(2)}s - ${seg.endTime.toFixed(2)}s (${seg.duration.toFixed(2)}s)`
    ));
    
    return {
      audioBlob,
      totalDuration: actualDuration,
      segments
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

