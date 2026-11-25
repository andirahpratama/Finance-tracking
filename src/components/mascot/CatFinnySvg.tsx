import React from 'react';
import { motion } from 'framer-motion';
import { MascotMood } from '../../types';

interface CatFinnySvgProps {
  mood: MascotMood;
  size?: number;
  className?: string;
  idPrefix?: string;
}

/**
 * Finny — Kucing Oren Gemas memakai syal hijau lembut sambil duduk memegang koin emas.
 * Mendukung 3 ekspresi sesuai verdict keuangan bulanan:
 * - happy (senang / Baik)
 * - neutral (khawatir / Waspada)
 * - sad (sedih / Buruk)
 */
export const CatFinnySvg: React.FC<CatFinnySvgProps> = ({
  mood,
  size = 140,
  className = '',
  idPrefix = 'finnyCat',
}) => {
  const furGradId = `${idPrefix}-fur`;
  const bellyGradId = `${idPrefix}-belly`;
  const scarfGradId = `${idPrefix}-scarf`;
  const coinGradId = `${idPrefix}-coin`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={`overflow-visible drop-shadow-xl ${className}`}
      aria-label={`Maskot Finny (${mood})`}
    >
      <defs>
        <linearGradient id={furGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="55%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

        <linearGradient id={bellyGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF7ED" />
          <stop offset="100%" stopColor="#FED7AA" />
        </linearGradient>

        <linearGradient id={scarfGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#69A984" />
          <stop offset="50%" stopColor="#4A8C67" />
          <stop offset="100%" stopColor="#397052" />
        </linearGradient>

        <linearGradient id={coinGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="80" cy="146" rx="46" ry="8" fill="#1E293B" opacity="0.16" />

      {/* Fluffy Wagging Tail (behind body) */}
      <motion.path
        d="M114 124 Q146 118 142 90 Q138 78 128 84 Q122 90 124 104 Q122 114 108 118 Z"
        fill={`url(#${furGradId})`}
        stroke="#C2410C"
        strokeWidth="1.5"
        animate={
          mood === 'happy'
            ? { rotate: [-4, 8, -4] }
            : mood === 'neutral'
            ? { rotate: [-2, 2, -2] }
            : { rotate: [0, -3, 0] }
        }
        style={{ transformOrigin: '112px 122px' }}
        transition={{ repeat: Infinity, duration: mood === 'happy' ? 1.8 : 2.8, ease: 'easeInOut' }}
      />
      {/* Tail tip cream stripe */}
      <path d="M135 84 Q142 84 141 93 Q135 94 132 88 Z" fill="#FFF7ED" opacity="0.85" />

      {/* Chubby Sitting Body */}
      <ellipse
        cx="80"
        cy="112"
        rx="40"
        ry="34"
        fill={`url(#${furGradId})`}
        stroke="#C2410C"
        strokeWidth="1.5"
      />
      {/* Cream Belly Patch */}
      <ellipse cx="80" cy="116" rx="26" ry="23" fill={`url(#${bellyGradId})`} />

      {/* Sitting Little Paws / Feet */}
      <ellipse cx="52" cy="138" rx="13" ry="8" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" />
      <ellipse cx="108" cy="138" rx="13" ry="8" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" />
      <path d="M48 139 L48 143 M53 139 L53 143" stroke="#EA580C" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M104 139 L104 143 M109 139 L109 143" stroke="#EA580C" strokeWidth="1.2" strokeLinecap="round" />

      {/* Ears (Perky for happy, slightly tilted for worried, droopy for sad) */}
      {mood === 'sad' ? (
        <>
          <path d="M38 46 Q20 42 26 68 Q35 64 46 56 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" />
          <path d="M36 50 Q27 49 30 62 Q35 60 41 55 Z" fill="#FBCFE8" />
          <path d="M122 46 Q140 42 134 68 Q125 64 114 56 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" />
          <path d="M124 50 Q133 49 130 62 Q125 60 119 55 Z" fill="#FBCFE8" />
        </>
      ) : (
        <>
          <path
            d={mood === 'neutral' ? 'M41 50 L31 20 Q46 22 60 36 Z' : 'M42 48 L34 16 Q50 20 62 35 Z'}
            fill={`url(#${furGradId})`}
            stroke="#C2410C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d={mood === 'neutral' ? 'M44 45 L37 25 Q47 26 56 36 Z' : 'M45 43 L39 22 Q49 25 58 35 Z'}
            fill="#FBCFE8"
          />
          <path
            d={mood === 'neutral' ? 'M119 50 L129 20 Q114 22 100 36 Z' : 'M118 48 L126 16 Q110 20 98 35 Z'}
            fill={`url(#${furGradId})`}
            stroke="#C2410C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d={mood === 'neutral' ? 'M116 45 L123 25 Q113 26 104 36 Z' : 'M115 43 L121 22 Q111 25 102 35 Z'}
            fill="#FBCFE8"
          />
        </>
      )}

      {/* Round Cute Cat Head */}
      <ellipse
        cx="80"
        cy="60"
        rx="42"
        ry="35"
        fill={`url(#${furGradId})`}
        stroke="#C2410C"
        strokeWidth="1.5"
      />

      {/* Forehead Tabby Stripes */}
      <path d="M74 28 Q80 35 76 41" stroke="#C2410C" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M80 26 Q80 34 80 42" stroke="#C2410C" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d="M86 28 Q80 35 84 41" stroke="#C2410C" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* Cream Muzzle Patch */}
      <ellipse cx="80" cy="70" rx="20" ry="13" fill="#FFF7ED" opacity="0.92" />

      {/* Rosy Cheeks */}
      <ellipse cx="48" cy="68" rx="7" ry="4.5" fill="#FB7185" opacity={mood === 'happy' ? 0.55 : 0.35} />
      <ellipse cx="112" cy="68" rx="7" ry="4.5" fill="#FB7185" opacity={mood === 'happy' ? 0.55 : 0.35} />

      {/* Cat Whiskers */}
      <g stroke="#9A3412" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
        <line x1="30" y1="62" x2="45" y2="65" />
        <line x1="28" y1="70" x2="45" y2="70" />
        <line x1="130" y1="62" x2="115" y2="65" />
        <line x1="132" y1="70" x2="115" y2="70" />
      </g>

      {/* Big Expressive Cat Eyes */}
      {mood === 'happy' && (
        <>
          {/* Large sparkling happy eyes */}
          <circle cx="60" cy="56" r="8.5" fill="#1E293B" />
          <circle cx="57" cy="53" r="3" fill="#FFFFFF" />
          <circle cx="63" cy="59" r="1.4" fill="#FFFFFF" />
          <circle cx="100" cy="56" r="8.5" fill="#1E293B" />
          <circle cx="97" cy="53" r="3" fill="#FFFFFF" />
          <circle cx="103" cy="59" r="1.4" fill="#FFFFFF" />

          {/* Warm pink nose & happy :3 smile */}
          <polygon points="77,65 83,65 80,69" fill="#F43F5E" />
          <path
            d="M71 71 Q75.5 76 80 70 Q84.5 76 89 71"
            stroke="#7C2D12"
            strokeWidth="2.3"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M76 74 Q80 79 84 74" fill="#FB7185" />

          {/* Sparkles */}
          <motion.g
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <path d="M22 28 L24 33 L29 35 L24 37 L22 42 L20 37 L15 35 L20 33 Z" fill="#FACC15" />
            <path d="M136 26 L138 30 L142 32 L138 34 L136 38 L134 34 L130 32 L134 30 Z" fill="#69A984" />
          </motion.g>
        </>
      )}

      {mood === 'neutral' && (
        <>
          {/* Slightly worried eyebrows */}
          <path d="M51 45 Q60 43 67 47" stroke="#7C2D12" strokeWidth="2.3" strokeLinecap="round" fill="none" />
          <path d="M109 45 Q100 43 93 47" stroke="#7C2D12" strokeWidth="2.3" strokeLinecap="round" fill="none" />

          {/* Big attentive worried eyes */}
          <circle cx="60" cy="57" r="8" fill="#1E293B" />
          <circle cx="57.5" cy="54" r="2.7" fill="#FFFFFF" />
          <circle cx="100" cy="57" r="8" fill="#1E293B" />
          <circle cx="97.5" cy="54" r="2.7" fill="#FFFFFF" />

          {/* Nose & slight wavy worried mouth */}
          <polygon points="77,65 83,65 80,69" fill="#F43F5E" />
          <path
            d="M72 73 Q76 70 80 73 Q84 76 88 73"
            stroke="#7C2D12"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Sweat drop */}
          <motion.path
            d="M117 44 Q121 51 117 55 Q113 51 117 44"
            fill="#38BDF8"
            animate={{ y: [0, 3, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
        </>
      )}

      {mood === 'sad' && (
        <>
          {/* Sad upward-slanted eyebrows */}
          <path d="M50 48 Q58 45 66 43" stroke="#7C2D12" strokeWidth="2.3" strokeLinecap="round" fill="none" />
          <path d="M110 48 Q102 45 94 43" stroke="#7C2D12" strokeWidth="2.3" strokeLinecap="round" fill="none" />

          {/* Big watery eyes */}
          <circle cx="60" cy="57" r="8" fill="#1E293B" />
          <circle cx="57" cy="54" r="2.8" fill="#FFFFFF" />
          <circle cx="63" cy="61" r="1.5" fill="#93C5FD" />
          <circle cx="100" cy="57" r="8" fill="#1E293B" />
          <circle cx="97" cy="54" r="2.8" fill="#FFFFFF" />
          <circle cx="103" cy="61" r="1.5" fill="#93C5FD" />

          {/* Nose & downturned sad mouth */}
          <polygon points="77,65 83,65 80,69" fill="#F43F5E" />
          <path
            d="M72 75 Q80 69 88 75"
            stroke="#7C2D12"
            strokeWidth="2.3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Falling tear drops */}
          <motion.path
            d="M52 65 Q55 73 51 77 Q47 73 52 65"
            fill="#60A5FA"
            animate={{ y: [0, 8, 14], opacity: [1, 0.85, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          />
          <motion.path
            d="M108 65 Q111 73 107 77 Q103 73 108 65"
            fill="#60A5FA"
            animate={{ y: [0, 8, 14], opacity: [1, 0.85, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: 0.35 }}
          />
        </>
      )}

      {/* Soft Green Scarf (Syal Hijau Lembut) */}
      <path
        d="M44 84 Q80 98 116 84 Q120 93 114 99 Q80 112 46 99 Q40 93 44 84 Z"
        fill={`url(#${scarfGradId})`}
        stroke="#2F5A43"
        strokeWidth="1.4"
      />
      {/* Scarf trailing tail */}
      <path
        d="M95 95 L108 118 Q101 121 94 117 L85 98 Z"
        fill="#4A8C67"
        stroke="#2F5A43"
        strokeWidth="1.3"
      />
      {/* Scarf knot */}
      <ellipse cx="90" cy="96" rx="8" ry="6" fill="#69A984" stroke="#2F5A43" strokeWidth="1.3" />

      {/* Front Paws Holding Shiny Gold Coin */}
      <circle cx="80" cy="118" r="15" fill={`url(#${coinGradId})`} stroke="#A16207" strokeWidth="1.8" />
      <circle cx="80" cy="118" r="11" fill="none" stroke="#FEF9C3" strokeWidth="1.2" opacity="0.85" />
      <text
        x="80"
        y="122"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#713F12"
        fontFamily="sans-serif"
      >
        Rp
      </text>

      {/* Left & right paws gripping the coin */}
      <ellipse cx="62" cy="118" rx="9" ry="7" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" transform="rotate(-15 62 118)" />
      <ellipse cx="98" cy="118" rx="9" ry="7" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" transform="rotate(15 98 118)" />
    </svg>
  );
};
