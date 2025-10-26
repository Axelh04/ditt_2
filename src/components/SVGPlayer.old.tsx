import React, { useState, useEffect, useRef } from 'react';
import type { SVGState } from '../services/geminiService';
import { generateCombinedVoiceover } from '../services/elevenLabsService';

interface SVGPlayerProps {
  stages: SVGState[];
  onComplete?: () => void;
}

// SVG Morphing Engine
class SVGMorpher {
  private duration: number;
  private startTime: number | null;
  private animationFrame: number | null;

  constructor(duration = 1500) {
    this.duration = duration;
    this.startTime = null;
    this.animationFrame = null;
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return { r: 255, g: 255, b: 255 };
  }

  private interpolateColor(color1: string, color2: string, progress: number): string {
    const c1 = this.parseColor(color1);
    const c2 = this.parseColor(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * progress);
    const g = Math.round(c1.g + (c2.g - c1.g) * progress);
    const b = Math.round(c1.b + (c2.b - c1.b) * progress);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private interpolateNumber(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  morph(fromSVG: SVGSVGElement, toSVG: SVGSVGElement, onComplete?: () => void): void {
    const fromElements: Record<string, Element> = {};
    const toElements: Record<string, Element> = {};

    fromSVG.querySelectorAll('[id]').forEach((el) => {
      if (el.id) fromElements[el.id] = el;
    });

    toSVG.querySelectorAll('[id]').forEach((el) => {
      if (el.id) toElements[el.id] = el;
    });

    interface Transition {
      element: Element;
      attributes: Record<string, { from: string; to: string; type: 'color' | 'number' }>;
    }

    const transitions: Transition[] = [];

    for (const id in fromElements) {
      if (toElements[id]) {
        const fromEl = fromElements[id];
        const toEl = toElements[id];

        const transition: Transition = {
          element: fromEl,
          attributes: {},
        };

        // Attributes to morph
        ['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'opacity', 'stroke-width'].forEach((attr) => {
          const fromVal = fromEl.getAttribute(attr);
          const toVal = toEl.getAttribute(attr);

          if (fromVal !== null && toVal !== null && fromVal !== toVal) {
            transition.attributes[attr] = {
              from: fromVal,
              to: toVal,
              type: (attr === 'fill' || attr === 'stroke') ? 'color' : 'number',
            };
          }
        });

        if (Object.keys(transition.attributes).length > 0) {
          transitions.push(transition);
        }
      }
    }

    const animate = (timestamp: number) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;
      const rawProgress = Math.min(elapsed / this.duration, 1);
      const progress = this.easeInOutCubic(rawProgress);

      transitions.forEach((transition) => {
        for (const attr in transition.attributes) {
          const { from, to, type } = transition.attributes[attr];
          let value: string | number;

          if (type === 'color') {
            value = this.interpolateColor(from, to, progress);
          } else {
            value = this.interpolateNumber(parseFloat(from), parseFloat(to), progress);
          }

          transition.element.setAttribute(attr, value.toString());
        }
      });

      if (rawProgress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.startTime = null;
        if (onComplete) onComplete();
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  cancel(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      this.startTime = null;
    }
  }
}

export const SVGPlayer: React.FC<SVGPlayerProps> = ({ stages, onComplete }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [combinedAudio, setCombinedAudio] = useState<{
    blob: Blob;
    segments: Array<{ startTime: number; endTime: number; duration: number }>;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentClauseIndex, setCurrentClauseIndex] = useState(-1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const svgDisplayRef = useRef<HTMLDivElement>(null);
  const morpherRef = useRef<SVGMorpher>(new SVGMorpher(1500));
  const clauseTimingsRef = useRef<number[]>([]);
  const generatedStagesRef = useRef<string>('');
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const activeSentenceRef = useRef<HTMLParagraphElement>(null);

  // Generate combined voiceover (only once per unique set of stages)
  useEffect(() => {
    const stagesKey = stages.map(s => s.script).join('||');
    
    console.log('🔍 SVGPlayer useEffect triggered');
    console.log('  - Current stages key:', stagesKey.substring(0, 50) + '...');
    console.log('  - Previously generated key:', generatedStagesRef.current.substring(0, 50) + '...');
    console.log('  - Keys match:', generatedStagesRef.current === stagesKey);
    
    // Skip if we've already generated voiceover for these exact stages
    if (generatedStagesRef.current === stagesKey) {
      console.log('✅ Skipping API call - voiceover already generated for these stages');
      return;
    }

    const generateVoiceover = async () => {
      console.log('🎤 Starting voiceover generation...');
      setIsLoading(true);
      
      try {
        const scripts = stages.map(stage => stage.script);
        const result = await generateCombinedVoiceover(scripts);
        
        setCombinedAudio({
          blob: result.audioBlob,
          segments: result.segments
        });
        
        generatedStagesRef.current = stagesKey;
        console.log('✅ Voiceover generation complete and cached');
      } catch (error) {
        console.error('❌ Error generating combined voiceover:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateVoiceover();
  }, [stages]);

  // Display initial SVG
  useEffect(() => {
    if (!isLoading && svgDisplayRef.current && stages.length > 0) {
      displayStage(0, false);
    }
  }, [isLoading, stages]);

  // Auto-scroll to center the active sentence/paragraph
  useEffect(() => {
    if (currentClauseIndex >= 0 && activeSentenceRef.current && captionContainerRef.current) {
      const container = captionContainerRef.current;
      const activeElement = activeSentenceRef.current;
      const containerHeight = container.clientHeight;
      
      // Get the element's position relative to its offset parent
      const elementRect = activeElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate current position of element relative to container
      const elementTopRelativeToContainer = elementRect.top - containerRect.top + container.scrollTop;
      const elementHeight = activeElement.offsetHeight;
      
      // Calculate scroll position to center the active element
      const targetScroll = elementTopRelativeToContainer - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [currentClauseIndex]);

  const displayStage = (stageIndex: number, animate: boolean) => {
    if (!svgDisplayRef.current) return;

    const stage = stages[stageIndex];
    const parser = new DOMParser();
    const doc = parser.parseFromString(stage.svg, 'image/svg+xml');
    const newSVG = doc.documentElement as unknown as SVGSVGElement;

    if (!animate || svgDisplayRef.current.children.length === 0) {
      // No animation, just replace
      svgDisplayRef.current.innerHTML = '';
      svgDisplayRef.current.appendChild(newSVG);
    } else {
      // Morph from current to new
      const currentSVG = svgDisplayRef.current.querySelector('svg');
      
      if (currentSVG) {
        morpherRef.current.morph(currentSVG as SVGSVGElement, newSVG);
      }
    }
  };

  const splitIntoSentences = (script: string): string[] => {
    // Split by sentence endings only (for paragraph structure)
    const sentences = script
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
    
    return sentences;
  };

  const splitIntoClauses = (script: string): string[] => {
    // Split by ! : ; , . ? for highlighting timing
    const clauses = script
      .split(/(?<=[!:;,.?])\s+/)
      .map(clause => clause.trim())
      .filter(clause => clause.length > 0);
    
    return clauses;
  };

  const getClausesForSentence = (sentence: string): string[] => {
    // Split a single sentence by ! : ; , . ? for clause highlighting
    const clauses = sentence
      .split(/(?<=[!:;,.?])\s+/)
      .map(clause => clause.trim())
      .filter(clause => clause.length > 0);
    
    return clauses;
  };

  const calculateClauseTimings = (clauses: string[], duration: number): number[] => {
    const timings: number[] = [];
    
    // Calculate weight for each clause based on character count
    const weights: number[] = clauses.map((clause) => {
      return Math.max(clause.length, 10); // Minimum weight
    });
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    // Distribute time proportionally based on weights
    let currentTime = 0;
    for (let i = 0; i < clauses.length; i++) {
      timings.push(currentTime);
      const clauseDuration = (weights[i] / totalWeight) * duration;
      currentTime += clauseDuration;
    }
    
    return timings;
  };

  const playStage = async (stageIndex: number) => {
    if (!combinedAudio) return;

    displayStage(stageIndex, stageIndex > 0);
    
    const segment = combinedAudio.segments[stageIndex];
    
    // Calculate clause timings for this stage
    const clauses = splitIntoClauses(stages[stageIndex].script);
    const timings = calculateClauseTimings(clauses, segment.duration);
    clauseTimingsRef.current = timings;
    setCurrentClauseIndex(-1);
    
    // Scroll to top of captions when starting a new stage
    if (captionContainerRef.current) {
      captionContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    // Create audio element if it doesn't exist, or reuse existing one
    if (!audioRef.current) {
      const audio = new Audio(URL.createObjectURL(combinedAudio.blob));
      audioRef.current = audio;
    }
    
    const audio = audioRef.current;
    
    // Set playback to start at the segment's start time
    audio.currentTime = segment.startTime;
    
    // Update progress and word highlighting during playback
    progressIntervalRef.current = window.setInterval(() => {
      if (audio.currentTime && audio.duration) {
        // Calculate progress within this segment
        const segmentProgress = ((audio.currentTime - segment.startTime) / segment.duration) * 100;
        setProgress(Math.min(Math.max(segmentProgress, 0), 100));
        
        // Update current clause based on time within segment
        const timeInSegment = audio.currentTime - segment.startTime + 0.1; // 100ms lookahead
        let clauseIdx = -1;
        for (let i = 0; i < timings.length; i++) {
          if (timeInSegment >= timings[i]) {
            clauseIdx = i;
          } else {
            break;
          }
        }
        setCurrentClauseIndex(clauseIdx);
        
        // Check if we've reached the end of this segment
        if (audio.currentTime >= segment.endTime) {
          audio.pause();
          
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          
          setProgress(100);
          setCurrentClauseIndex(-1);
          
          // Move to next stage
          if (stageIndex < stages.length - 1) {
            setTimeout(() => {
              setCurrentStageIndex(stageIndex + 1);
              setProgress(0);
              playStage(stageIndex + 1);
            }, 500);
          } else {
            // Video complete
            setIsPlaying(false);
            if (onComplete) onComplete();
          }
        }
      }
    }, 30); // Update more frequently for smoother highlighting

    await audio.play();
  };

  const handlePlay = () => {
    if (!combinedAudio) return;
    setIsPlaying(true);
    setCurrentStageIndex(0);
    setProgress(0);
    playStage(0);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    morpherRef.current.cancel();
    setIsPlaying(false);
    setCurrentStageIndex(0);
    setProgress(0);
    setCurrentClauseIndex(-1);
  };

  const currentStage = stages[currentStageIndex];
  const sentences = splitIntoSentences(currentStage.script);

  // Build a map of which clauses belong to which sentence
  let globalClauseIndex = 0;
  const sentenceClauseMap = sentences.map(sentence => {
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

  // Find which sentence contains the current active clause
  const activeSentenceIndex = sentenceClauseMap.findIndex(
    sentenceData => currentClauseIndex >= sentenceData.startClauseIndex && 
                    currentClauseIndex <= sentenceData.endClauseIndex
  );

  return (
    <div className="svg-player">
      <div className="svg-viewport">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Generating voiceovers...</p>
          </div>
        ) : (
          <div ref={svgDisplayRef} className="svg-container" />
        )}
      </div>
      
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
      
      <div className="player-info">
        <h3>{currentStage.stageTitle}</h3>
        <p className="stage-counter">Stage {currentStage.stageNumber} of {stages.length}</p>
        <p className="stage-script">{currentStage.script}</p>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="player-controls">
        {!isPlaying ? (
          <button 
            onClick={handlePlay} 
            disabled={isLoading || !combinedAudio}
            className="play-button"
          >
            ▶ Play
          </button>
        ) : (
          <button onClick={handleStop} className="stop-button">
            ■ Stop
          </button>
        )}
      </div>

      <div className="stage-timeline">
        {stages.map((_, index) => (
          <div 
            key={index} 
            className={`stage-dot ${index === currentStageIndex ? 'active' : ''} ${index < currentStageIndex ? 'completed' : ''}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};
