import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = React.memo<ProgressBarProps>(({ progress }) => {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

