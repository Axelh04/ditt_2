import { useState, useCallback } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { SVGPlayer } from './components/SVGPlayer';
import { QuizSection } from './components/QuizSection';
import { GridBackground } from './components/GridBackground';
import { TodoList, type GenerationProgress } from './components/TodoList';
import { generateProcessSVGs } from './services/geminiService';
import { ApiError } from './services/apiClient';
import type { ProcessBreakdown } from './services/geminiService';
import './App.css';

function App() {
  const [processData, setProcessData] = useState<ProcessBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

  // Realistic time estimates (in seconds) based on typical processing times
  const STAGE_ESTIMATES = {
    analyzing: 2,       // Quick validation
    breakdown: 25,      // Backend LLM processing for SVG generation (main bottleneck)
    voiceover: 15,      // ElevenLabs TTS generation
  };

  const TOTAL_ESTIMATED_TIME = Object.values(STAGE_ESTIMATES).reduce((a, b) => a + b, 0);

  const handleQuerySubmit = useCallback(async (query: string) => {
    console.log('🔵 handleQuerySubmit called');
    setIsLoading(true);
    setError(null);
    setProcessData(null);

    const startTime = Date.now();

    // Step 1: Initialize with analyzing status
    const step1Start = Date.now();
    setGenerationProgress({
      currentStep: 0,
      totalSteps: 3,
      todos: [
        { id: '1', label: 'Analyzing your request', status: 'in-progress', startTime: step1Start, estimatedDuration: STAGE_ESTIMATES.analyzing },
        { id: '2', label: 'Generating process breakdown & SVGs', status: 'pending', estimatedDuration: STAGE_ESTIMATES.breakdown },
        { id: '3', label: 'Synthesizing voiceovers', status: 'pending', estimatedDuration: STAGE_ESTIMATES.voiceover },
      ],
      startTime,
      estimatedTotalTime: TOTAL_ESTIMATED_TIME
    });

    try {
      // Brief validation period
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Start backend processing
      const step2Start = Date.now();
      setGenerationProgress({
        currentStep: 1,
        totalSteps: 3,
        todos: [
          { id: '1', label: 'Analyzing your request', status: 'completed' },
          { id: '2', label: 'Generating process breakdown & SVGs', status: 'in-progress', startTime: step2Start, estimatedDuration: STAGE_ESTIMATES.breakdown },
          { id: '3', label: 'Synthesizing voiceovers', status: 'pending', estimatedDuration: STAGE_ESTIMATES.voiceover },
        ],
        startTime,
        estimatedTotalTime: TOTAL_ESTIMATED_TIME
      });

      const data = await generateProcessSVGs(query);
      
      // Step 3: Backend complete, data received
      setGenerationProgress({
        currentStep: 2,
        totalSteps: 3,
        todos: [
          { id: '1', label: 'Analyzing your request', status: 'completed' },
          { id: '2', label: 'Generating process breakdown & SVGs', status: 'completed' },
          { id: '3', label: 'Synthesizing voiceovers', status: 'pending', estimatedDuration: STAGE_ESTIMATES.voiceover },
        ],
        startTime,
        estimatedTotalTime: TOTAL_ESTIMATED_TIME
      });

      console.log('📦 Setting processData:', data);
      setProcessData(data);

      // Note: Voiceover generation continues in SVGPlayer component
      // Progress will be updated via callbacks

    } catch (err) {
      console.error('Error:', err);
      
      // Better error handling with specific messages
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setError('Invalid query. Please try rephrasing your question.');
        } else if (err.statusCode === 500) {
          setError('Server error. Please try again in a moment.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError('Failed to generate process visualization. Please check your connection and try again.');
      }
      setGenerationProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [STAGE_ESTIMATES, TOTAL_ESTIMATED_TIME]);

  const handleVoiceoverStart = useCallback(() => {
    if (!generationProgress) return;
    
    const step3Start = Date.now();
    setGenerationProgress({
      currentStep: 2,
      totalSteps: 3,
      todos: [
        { id: '1', label: 'Analyzing your request', status: 'completed' },
        { id: '2', label: 'Generating process breakdown & SVGs', status: 'completed' },
        { id: '3', label: 'Synthesizing voiceovers', status: 'in-progress', startTime: step3Start, estimatedDuration: STAGE_ESTIMATES.voiceover },
      ],
      startTime: generationProgress.startTime,
      estimatedTotalTime: TOTAL_ESTIMATED_TIME
    });
  }, [generationProgress, STAGE_ESTIMATES, TOTAL_ESTIMATED_TIME]);

  const handleVoiceoverComplete = useCallback(() => {
    if (!generationProgress) return;

    setGenerationProgress({
      currentStep: 3,
      totalSteps: 3,
      todos: [
        { id: '1', label: 'Analyzing your request', status: 'completed' },
        { id: '2', label: 'Generating process breakdown & SVGs', status: 'completed' },
        { id: '3', label: 'Synthesizing voiceovers', status: 'completed' },
      ],
      startTime: generationProgress.startTime,
      estimatedTotalTime: TOTAL_ESTIMATED_TIME
    });
    
    // Clear progress after completion
    setTimeout(() => setGenerationProgress(null), 1000);
  }, [generationProgress, TOTAL_ESTIMATED_TIME]);

  const handleVideoComplete = useCallback(() => {
    console.log('Video playback completed!');
  }, []);

  const handleReset = useCallback(() => {
    setProcessData(null);
    setError(null);
    setGenerationProgress(null);
  }, []);

  const handleInputFocus = useCallback(() => setIsInputFocused(true), []);
  const handleInputBlur = useCallback(() => setIsInputFocused(false), []);

  return (
    <div className="app">
      <GridBackground isInputFocused={isInputFocused} />
      <div className="container">
        {!processData ? (
          <div className="chat-view">
            <ChatInterface 
              onSubmit={handleQuerySubmit} 
              isLoading={isLoading}
              onInputFocus={handleInputFocus}
              onInputBlur={handleInputBlur}
              hideExamples={isLoading}
            />
            <TodoList progress={generationProgress} />
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="scroll-snap-container">
            <div className="player-view snap-section">
              {generationProgress && (
                <div className="player-progress-overlay">
                  <TodoList progress={generationProgress} />
                </div>
              )}
              <div className="player-header">
                <h2>{processData.processName}</h2>
                <button onClick={handleReset} className="reset-button">
                  ← New Process
                </button>
              </div>
              <SVGPlayer 
                stages={processData.stages} 
                onComplete={handleVideoComplete}
                onVoiceoverStart={handleVoiceoverStart}
                onVoiceoverComplete={handleVoiceoverComplete}
              />
              {/* <div className="scroll-indicator">
                <div className="scroll-arrow">↓</div>
                <p>Scroll down for quiz</p>
              </div> */}
            </div>
            <div className="quiz-view snap-section">
              <QuizSection processData={processData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
