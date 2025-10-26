import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { ApiError } from '../middleware/errorHandler.js';

const PIPER_DIR = process.env.PIPER_DIR || join(process.cwd(), 'piper');
const PIPER_BINARY = join(PIPER_DIR, 'piper');
const VOICE_MODEL = join(PIPER_DIR, 'models', 'en_US-lessac-medium.onnx');
const VOICE_MODEL_JSON = join(PIPER_DIR, 'models', 'en_US-lessac-medium.onnx.json');
const TEMP_DIR = join(process.cwd(), 'tmp');

export type AudioSegment = {
  startTime: number;
  endTime: number;
  duration: number;
}

export type CombinedAudioResult = {
  audioBase64: string;
  totalDuration: number;
  segments: AudioSegment[];
}

/**
 * Estimate audio duration based on word count
 * Piper TTS typically speaks at ~150-180 words per minute
 */
function estimateAudioDuration(wordCount: number): number {
  const wordsPerMinute = 160;
  return (wordCount / wordsPerMinute) * 60;
}

/**
 * Check if Piper TTS is installed and configured
 */
export function isPiperAvailable(): boolean {
  return existsSync(PIPER_BINARY) && existsSync(VOICE_MODEL);
}

/**
 * Generate speech using Piper TTS
 */
async function generateSpeechWithPiper(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (!isPiperAvailable()) {
      reject(new ApiError(500, 'Piper TTS is not installed. Please run the setup script.'));
      return;
    }

    const chunks: Buffer[] = [];
    
    // Spawn Piper process
    // piper --model <model_path> --output_raw | ...
    const piper = spawn(PIPER_BINARY, [
      '--model', VOICE_MODEL,
      '--output-raw'
    ]);

    // Write text to stdin
    piper.stdin.write(text);
    piper.stdin.end();

    // Collect audio data from stdout
    piper.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Handle errors
    piper.stderr.on('data', (data: Buffer) => {
      console.error('Piper stderr:', data.toString());
    });

    piper.on('error', (error: Error) => {
      reject(new ApiError(500, `Piper process error: ${error.message}`));
    });

    piper.on('close', (code: number) => {
      if (code !== 0) {
        reject(new ApiError(500, `Piper process exited with code ${code}`));
        return;
      }

      const audioBuffer = Buffer.concat(chunks);
      
      if (audioBuffer.length === 0) {
        reject(new ApiError(500, 'Piper generated empty audio'));
        return;
      }

      // Convert raw PCM to WAV format
      const wavBuffer = createWavHeader(audioBuffer);
      resolve(wavBuffer);
    });
  });
}

/**
 * Create WAV header for raw PCM audio
 * Piper outputs raw PCM 16-bit, 22050 Hz, mono
 */
function createWavHeader(pcmData: Buffer): Buffer {
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmData.length;

  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  return Buffer.concat([header, pcmData]);
}

/**
 * Generates a single voiceover for multiple scripts and calculates time segments for each
 */
export async function generateCombinedVoiceover(scripts: string[]): Promise<CombinedAudioResult> {
  console.time('⏱️ Piper TTS Generation');
  
  try {
    // Ensure temp directory exists
    if (!existsSync(TEMP_DIR)) {
      await mkdir(TEMP_DIR, { recursive: true });
    }

    // Combine scripts with pauses
    // Using multiple periods creates natural pauses in Piper TTS
    const combinedText = scripts.join('. . . ');
    
    console.log(`📊 Generating voiceover with Piper TTS for ${combinedText.length} characters`);
    
    // Generate audio with Piper
    const audioBuffer = await generateSpeechWithPiper(combinedText);
    
    // Convert to base64 for JSON transmission
    const audioBase64 = audioBuffer.toString('base64');
    
    // Calculate duration estimate based on word count
    const wordCounts = scripts.map(script => script.split(/\s+/).length);
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    const totalDuration = estimateAudioDuration(totalWords);
    
    console.timeEnd('⏱️ Piper TTS Generation');
    
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
    
    console.log(`✅ Generated audio with Piper TTS (FREE, ${totalDuration.toFixed(2)}s)`);
    
    return {
      audioBase64,
      totalDuration,
      segments
    };
  } catch (error: any) {
    console.error('Error generating voiceover with Piper:', error);
    throw new ApiError(500, `Failed to generate voiceover: ${error.message}`);
  }
}

