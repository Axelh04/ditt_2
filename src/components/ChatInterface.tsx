import React, { useState, useCallback } from 'react';

interface ChatInterfaceProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
}

export const ChatInterface = React.memo<ChatInterfaceProps>(({ onSubmit, isLoading, onInputFocus, onInputBlur }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery(''); // Clear input after submission
    }
  }, [query, isLoading, onSubmit]);

  const handleExampleClick = useCallback((exampleQuery: string) => {
    setQuery(exampleQuery);
  }, []);

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h1>Diagramma</h1>
        <p className="subtitle">Learn any process through animated SVG explanations</p>
      </div>
      
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder="What process would you like to learn about?"
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="submit-button"
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Generating...
              </>
            ) : (
              '→'
            )}
          </button>
        </div>
      </form>

      <div className="example-queries">
        <p className="examples-label">Try asking about:</p>
        <div className="examples-list">
          <button onClick={() => handleExampleClick('how to weld a joint')} className="example-chip">
            Welding Process
          </button>
          <button onClick={() => handleExampleClick('how an engine works')} className="example-chip">
            Engine Operation
          </button>
          <button onClick={() => handleExampleClick('electrical circuit basics')} className="example-chip">
            Circuit Basics
          </button>
          <button onClick={() => handleExampleClick('how to frame a wall')} className="example-chip">
            Wall Framing
          </button>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

