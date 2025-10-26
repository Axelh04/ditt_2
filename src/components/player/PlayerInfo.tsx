import React from 'react';

interface PlayerInfoProps {
  stageTitle: string;
  stageNumber: number;
  totalStages: number;
  script: string;
}

export const PlayerInfo = React.memo<PlayerInfoProps>(({ 
  stageTitle, 
  stageNumber, 
  totalStages, 
  script 
}) => {
  return (
    <div className="player-info">
      <h3>{stageTitle}</h3>
      <p className="stage-counter">Stage {stageNumber} of {totalStages}</p>
      <p className="stage-script">{script}</p>
    </div>
  );
});

PlayerInfo.displayName = 'PlayerInfo';

