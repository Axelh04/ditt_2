import React, { useRef, useEffect, useMemo } from 'react';
import { splitIntoSentences, getClausesForSentence } from '../../utils/textProcessing';

interface CaptionPanelProps {
  script: string;
  currentClauseIndex: number;
}

export const CaptionPanel = React.memo<CaptionPanelProps>(({ script, currentClauseIndex }) => {
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const activeSentenceRef = useRef<HTMLParagraphElement>(null);

  // Memoize sentence parsing
  const sentences = useMemo(() => splitIntoSentences(script), [script]);

  // Build a map of which clauses belong to which sentence
  const sentenceClauseMap = useMemo(() => {
    let globalClauseIndex = 0;
    return sentences.map(sentence => {
      const clausesInSentence = getClausesForSentence(sentence);
      const startIndex = globalClauseIndex;
      globalClauseIndex += clausesInSentence.length;
      return {
        sentence,
        clauses: clausesInSentence,
        startClauseIndex: startIndex,
        endClauseIndex: globalClauseIndex - 1
      };
    });
  }, [sentences]);

  // Find which sentence contains the current active clause
  const activeSentenceIndex = useMemo(() => 
    sentenceClauseMap.findIndex(
      sentenceData => currentClauseIndex >= sentenceData.startClauseIndex && 
                      currentClauseIndex <= sentenceData.endClauseIndex
    ),
    [sentenceClauseMap, currentClauseIndex]
  );

  // Auto-scroll to center the active sentence
  useEffect(() => {
    if (currentClauseIndex >= 0 && activeSentenceRef.current && captionContainerRef.current) {
      const container = captionContainerRef.current;
      const activeElement = activeSentenceRef.current;
      const containerHeight = container.clientHeight;
      
      const elementRect = activeElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const elementTopRelativeToContainer = elementRect.top - containerRect.top + container.scrollTop;
      const elementHeight = activeElement.offsetHeight;
      
      const targetScroll = elementTopRelativeToContainer - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [currentClauseIndex]);

  return (
    <div className="caption-panel">
      <div className="caption-scroll-container" ref={captionContainerRef}>
        <div className="caption-text">
          {sentenceClauseMap.map((sentenceData, sentenceIndex) => {
            const isSentenceActive = sentenceIndex === activeSentenceIndex;
            
            return (
              <p 
                key={sentenceIndex} 
                className="sentence"
                ref={isSentenceActive ? activeSentenceRef : null}
              >
                {sentenceData.clauses.map((clause, clauseIndexInSentence) => {
                  const globalIndex = sentenceData.startClauseIndex + clauseIndexInSentence;
                  let className = 'clause';
                  const isActive = globalIndex === currentClauseIndex;
                  if (isActive) {
                    className += ' active';
                  } else if (globalIndex < currentClauseIndex) {
                    className += ' past';
                  } else {
                    className += ' future';
                  }
                  
                  return (
                    <span 
                      key={clauseIndexInSentence} 
                      className={className}
                    >
                      {clause}
                      {clauseIndexInSentence < sentenceData.clauses.length - 1 && ' '}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>
      </div>
      <div className="caption-fade caption-fade-top"></div>
      <div className="caption-fade caption-fade-bottom"></div>
    </div>
  );
});

CaptionPanel.displayName = 'CaptionPanel';

