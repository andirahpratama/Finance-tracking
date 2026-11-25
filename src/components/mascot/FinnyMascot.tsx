import React from 'react';
import { motion } from 'framer-motion';
import { MascotMood } from '../../types';
import { CatFinnySvg } from './CatFinnySvg';

interface FinnyMascotProps {
  mood: MascotMood;
  className?: string;
  size?: number;
}

export const FinnyMascot: React.FC<FinnyMascotProps> = ({ mood, className = '', size = 80 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <motion.div
        animate={{
          y: mood === 'sad' ? [0, -2, 0] : [0, -5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: mood === 'sad' ? 3 : 2.2,
          ease: 'easeInOut',
        }}
      >
        <CatFinnySvg mood={mood} size={size} idPrefix={`finny-mini-${mood}`} />
      </motion.div>
    </div>
  );
};
