import React from 'react';

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  hasAudio: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export const PlayerControls = React.memo<PlayerControlsProps>(({
  isPlaying,
  isLoading,
  hasAudio,
  onPlay,
  onStop
}) => {
  return (
    <div className="player-controls">
      {!isPlaying ? (
        <button 
          onClick={onPlay} 
          disabled={isLoading || !hasAudio}
          className="play-button"
        >
          ▶ Play
        </button>
      ) : (
        <button onClick={onStop} className="stop-button">
          ■ Stop
        </button>
      )}
    </div>
  );
});

PlayerControls.displayName = 'PlayerControls';

