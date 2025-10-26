import React from 'react';
import { motion } from 'framer-motion';

interface GridBackgroundProps {
  isInputFocused: boolean;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ isInputFocused }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <motion.div
        className="grid-background"
        initial={{ opacity: 0.3 }}
        animate={
          isInputFocused
            ? {
                opacity: [0.3, 0.3, 0],
                scale: [1, 1.5, 2.5],
              }
            : {
                opacity: 0.3,
                scale: 1,
              }
        }
        transition={
          isInputFocused
            ? {
                duration: 1.5,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.4, 1],
              }
            : {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `
            linear-gradient(90deg, var(--border) 1px, transparent 1px),
            linear-gradient(0deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          backgroundPosition: 'center',
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
};

