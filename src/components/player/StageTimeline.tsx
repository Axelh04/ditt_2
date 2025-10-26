import React from 'react';

interface StageTimelineProps {
  stagesCount: number;
  currentStageIndex: number;
}

export const StageTimeline = React.memo<StageTimelineProps>(({ stagesCount, currentStageIndex }) => {
  return (
    <div className="stage-timeline">
      {Array.from({ length: stagesCount }, (_, index) => (
        <div 
          key={index} 
          className={`stage-dot ${index === currentStageIndex ? 'active' : ''} ${index < currentStageIndex ? 'completed' : ''}`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
});

StageTimeline.displayName = 'StageTimeline';

