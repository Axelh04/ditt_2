import { useState, useCallback } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { SVGPlayer } from './components/SVGPlayer';
import { QuizSection } from './components/QuizSection';
import { GridBackground } from './components/GridBackground';
import { generateProcessSVGs } from './services/geminiService';
import { ApiError } from './services/apiClient';
import type { ProcessBreakdown } from './services/geminiService';
import './App.css';

function App() {
  const [processData, setProcessData] = useState<ProcessBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleQuerySubmit = useCallback(async (query: string) => {
    console.log('🔵 handleQuerySubmit called');
    setIsLoading(true);
    setError(null);
    setProcessData(null);

    try {
      const data = await generateProcessSVGs(query);
      console.log('📦 Setting processData:', data);
      setProcessData(data);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVideoComplete = useCallback(() => {
    console.log('Video playback completed!');
  }, []);

  const handleReset = useCallback(() => {
    setProcessData(null);
    setError(null);
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
            />
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="scroll-snap-container">
            <div className="player-view snap-section">
              <div className="player-header">
                <h2>{processData.processName}</h2>
                <button onClick={handleReset} className="reset-button">
                  ← New Process
                </button>
              </div>
              <SVGPlayer 
                stages={processData.stages} 
                onComplete={handleVideoComplete}
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
