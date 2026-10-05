import React from 'react';
import { motion } from 'framer-motion';
import { MascotMood } from '../../types';

interface FinnyMascotProps {
  mood: MascotMood;
  className?: string;
  size?: number;
}

export const FinnyMascot: React.FC<FinnyMascotProps> = ({ mood, className = '', size = 80 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        className="overflow-visible"
        animate={{
          y: mood === 'sad' ? [0, -3, 0] : [0, -5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: mood === 'sad' ? 3 : 2,
          ease: 'easeInOut',
        }}
      >
        <defs>
          <linearGradient id="finnyHappyBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="finnyNeutralBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="finnySadBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="60%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>

          <linearGradient id="finnyCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="70" cy="130" rx="38" ry="6" fill="#020617" opacity="0.25" />

        {/* Ears */}
        {mood === 'happy' && (
          <>
            <ellipse cx="40" cy="36" rx="15" ry="19" fill="url(#finnyHappyBody)" transform="rotate(-20 40 36)" />
            <ellipse cx="40" cy="36" rx="8" ry="11" fill="#A7F3D0" transform="rotate(-20 40 36)" />
            <ellipse cx="100" cy="36" rx="15" ry="19" fill="url(#finnyHappyBody)" transform="rotate(20 100 36)" />
            <ellipse cx="100" cy="36" rx="8" ry="11" fill="#A7F3D0" transform="rotate(20 100 36)" />
          </>
        )}

        {mood === 'neutral' && (
          <>
            <ellipse cx="42" cy="38" rx="14" ry="17" fill="url(#finnyNeutralBody)" transform="rotate(-15 42 38)" />
            <ellipse cx="42" cy="38" rx="7" ry="9" fill="#FDE68A" transform="rotate(-15 42 38)" />
            <ellipse cx="98" cy="38" rx="14" ry="17" fill="url(#finnyNeutralBody)" transform="rotate(15 98 38)" />
            <ellipse cx="98" cy="38" rx="7" ry="9" fill="#FDE68A" transform="rotate(15 98 38)" />
          </>
        )}

        {mood === 'sad' && (
          <>
            <ellipse cx="36" cy="52" rx="14" ry="18" fill="url(#finnySadBody)" transform="rotate(-55 36 52)" />
            <ellipse cx="36" cy="52" rx="7" ry="10" fill="#FECDD3" transform="rotate(-55 36 52)" />
            <ellipse cx="104" cy="52" rx="14" ry="18" fill="url(#finnySadBody)" transform="rotate(55 104 52)" />
            <ellipse cx="104" cy="52" rx="7" ry="10" fill="#FECDD3" transform="rotate(55 104 52)" />
          </>
        )}

        {/* Main Body */}
        <circle
          cx="70"
          cy="76"
          r="46"
          fill={
            mood === 'happy'
              ? 'url(#finnyHappyBody)'
              : mood === 'neutral'
              ? 'url(#finnyNeutralBody)'
              : 'url(#finnySadBody)'
          }
        />

        {/* Tummy */}
        <ellipse cx="70" cy="88" rx="26" ry="22" fill="#FFFFFF" opacity={mood === 'happy' ? 0.35 : 0.25} />

        {/* Coin Emblem */}
        <circle cx="70" cy="88" r="11" fill="url(#finnyCoinGrad)" stroke="#B45309" strokeWidth="1.2" />
        <text x="70" y="92" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">
          Rp
        </text>

        {/* Cheeks */}
        <ellipse cx="43" cy="78" rx="7" ry="4.5" fill={mood === 'happy' ? '#F472B6' : mood === 'neutral' ? '#FBBF24' : '#FDA4AF'} opacity="0.75" />
        <ellipse cx="97" cy="78" rx="7" ry="4.5" fill={mood === 'happy' ? '#F472B6' : mood === 'neutral' ? '#FBBF24' : '#FDA4AF'} opacity="0.75" />

        {/* Facial Expression */}
        {mood === 'happy' && (
          <>
            <path d="M48 64 Q56 52 64 64" stroke="#022C22" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M76 64 Q84 52 92 64" stroke="#022C22" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M57 74 Q70 87 83 74" fill="#881337" stroke="#022C22" strokeWidth="2.5" />
            <path d="M62 79 Q70 84 78 79" fill="#FB7185" />
          </>
        )}

        {mood === 'neutral' && (
          <>
            <path d="M48 54 L62 57" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M92 54 L78 57" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="56" cy="63" r="5" fill="#1E293B" />
            <circle cx="57.5" cy="61.5" r="1.5" fill="#FFFFFF" />
            <circle cx="84" cy="63" r="5" fill="#1E293B" />
            <circle cx="85.5" cy="61.5" r="1.5" fill="#FFFFFF" />
            <path d="M60 76 Q70 79 80 76" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Sweat drop */}
            <path d="M103 52 Q107 59 103 63 Q99 59 103 52" fill="#38BDF8" />
          </>
        )}

        {mood === 'sad' && (
          <>
            {/* Panicked eyebrows */}
            <path d="M47 57 L61 53" stroke="#4C0519" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M93 57 L79 53" stroke="#4C0519" strokeWidth="2.5" strokeLinecap="round" />
            {/* Wide crying/panicked eyes */}
            <ellipse cx="55" cy="65" rx="5" ry="6.5" fill="#1E293B" />
            <circle cx="56.5" cy="62" r="1.8" fill="#FFFFFF" />
            <ellipse cx="85" cy="65" rx="5" ry="6.5" fill="#1E293B" />
            <circle cx="86.5" cy="62" r="1.8" fill="#FFFFFF" />
            {/* Trembling mouth */}
            <path d="M58 80 Q70 73 82 80" stroke="#4C0519" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Tears */}
            <path d="M51 72 Q53 82 50 86 Q47 82 51 72" fill="#60A5FA" opacity="0.85" />
            <path d="M89 72 Q91 82 88 86 Q85 82 89 72" fill="#60A5FA" opacity="0.85" />
          </>
        )}
      </motion.svg>
    </div>
  );
};
