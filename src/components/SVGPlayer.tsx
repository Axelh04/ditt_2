import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SVGState } from '../services/geminiService';
import { generateCombinedVoiceover } from '../services/elevenLabsService';
import { SVGDisplay, type SVGDisplayHandle } from './player/SVGDisplay';
import { CaptionPanel } from './player/CaptionPanel';
import { PlayerControls } from './player/PlayerControls';
import { StageTimeline } from './player/StageTimeline';
import { PlayerInfo } from './player/PlayerInfo';
import { ProgressBar } from './player/ProgressBar';
import { splitIntoClauses, calculateClauseTimings } from '../utils/textProcessing';

interface SVGPlayerProps {
  stages: SVGState[];
  onComplete?: () => void;
  onVoiceoverStart?: () => void;
  onVoiceoverComplete?: () => void;
}

type CombinedAudio = {
  blob: Blob;
  segments: Array<{ startTime: number; endTime: number; duration: number }>;
};

export const SVGPlayer: React.FC<SVGPlayerProps> = ({ stages, onComplete, onVoiceoverStart, onVoiceoverComplete }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [combinedAudio, setCombinedAudio] = useState<CombinedAudio | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentClauseIndex, setCurrentClauseIndex] = useState(-1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const svgDisplayRef = useRef<SVGDisplayHandle>(null);
  const clauseTimingsRef = useRef<number[]>([]);
  const generatedStagesRef = useRef<string>('');

  // Generate combined voiceover (only once per unique set of stages)
  useEffect(() => {
    const stagesKey = stages.map(s => s.script).join('||');
    
    if (generatedStagesRef.current === stagesKey) {
      console.log('✅ Skipping API call - voiceover already generated for these stages');
      return;
    }

    const generateVoiceover = async () => {
      console.log('🎤 Starting voiceover generation...');
      setIsLoading(true);
      onVoiceoverStart?.();
      
      try {
        const scripts = stages.map(stage => stage.script);
        const result = await generateCombinedVoiceover(scripts);
        
        setCombinedAudio({
          blob: result.audioBlob,
          segments: result.segments
        });
        
        generatedStagesRef.current = stagesKey;
        console.log('✅ Voiceover generation complete and cached');
        onVoiceoverComplete?.();
      } catch (error) {
        console.error('❌ Error generating combined voiceover:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateVoiceover();
  }, [stages, onVoiceoverStart, onVoiceoverComplete]);

  // Display initial SVG
  useEffect(() => {
    if (!isLoading && svgDisplayRef.current && stages.length > 0) {
      svgDisplayRef.current.displayStage(stages[0].svg, false);
    }
  }, [isLoading, stages]);

  const playStage = useCallback(async (stageIndex: number) => {
    if (!combinedAudio || !svgDisplayRef.current) return;

    svgDisplayRef.current.displayStage(stages[stageIndex].svg, stageIndex > 0);
    
    const segment = combinedAudio.segments[stageIndex];
    
    // Calculate clause timings for this stage
    const clauses = splitIntoClauses(stages[stageIndex].script);
    const timings = calculateClauseTimings(clauses, segment.duration);
    clauseTimingsRef.current = timings;
    setCurrentClauseIndex(-1);

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
        const timeInSegment = audio.currentTime - segment.startTime + 0.1;
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
    }, 30);

    await audio.play();
  }, [combinedAudio, stages, onComplete]);

  const handlePlay = useCallback(() => {
    if (!combinedAudio) return;
    setIsPlaying(true);
    setCurrentStageIndex(0);
    setProgress(0);
    playStage(0);
  }, [combinedAudio, playStage]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (svgDisplayRef.current) {
      svgDisplayRef.current.cancel();
    }
    setIsPlaying(false);
    setCurrentStageIndex(0);
    setProgress(0);
    setCurrentClauseIndex(-1);
  }, []);

  const currentStage = stages[currentStageIndex];

  return (
    <div className="svg-player">
      <SVGDisplay 
        ref={svgDisplayRef}
        isLoading={isLoading}
      />
      
      <CaptionPanel 
        script={currentStage.script}
        currentClauseIndex={currentClauseIndex}
      />
      
      <PlayerInfo 
        stageTitle={currentStage.stageTitle}
        stageNumber={currentStage.stageNumber}
        totalStages={stages.length}
        script={currentStage.script}
      />

      <ProgressBar progress={progress} />

      <PlayerControls 
        isPlaying={isPlaying}
        isLoading={isLoading}
        hasAudio={!!combinedAudio}
        onPlay={handlePlay}
        onStop={handleStop}
      />

      <StageTimeline 
        stagesCount={stages.length}
        currentStageIndex={currentStageIndex}
      />
    </div>
  );
};

