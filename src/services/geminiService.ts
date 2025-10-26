/**
 * Gemini Service - Now calls backend API instead of directly calling Gemini
 */
import { apiClient } from './apiClient';

export type SVGState = {
  svg: string;
  script: string;
  stageNumber: number;
  stageTitle: string;
}

export type ProcessBreakdown = {
  processName: string;
  stages: SVGState[];
}

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  svgReference: number | null;
}

export type QuizData = {
  questions: QuizQuestion[];
}

export async function generateProcessSVGs(userQuery: string): Promise<ProcessBreakdown> {
  console.time('⏱️ Process Generation API Call');
  
  try {
    const data = await apiClient.post<ProcessBreakdown>('/process/generate', {
      query: userQuery
    });
    
    console.timeEnd('⏱️ Process Generation API Call');
    return data;
  } catch (error) {
    console.error('Error generating process SVGs:', error);
    throw error;
  }
}

export async function generateQuiz(processData: ProcessBreakdown): Promise<QuizData> {
  console.time('⏱️ Quiz Generation API Call');
  
  try {
    const data = await apiClient.post<QuizData>('/quiz/generate', {
      processData
    });
    
    console.timeEnd('⏱️ Quiz Generation API Call');
    return data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

