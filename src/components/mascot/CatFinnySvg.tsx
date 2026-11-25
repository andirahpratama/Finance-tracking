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
 * Finny — Kucing Oren Gemas bersyal hijau lembut memegang koin emas.
 * 3 ekspresi JELAS berbeda dari wajah, telinga, postur, dan posisi koin:
 * 1) happy (Senang / Baik): telinga tegak, mata berbinar & senyum lebar, koin diangkat tinggi!
 * 2) neutral (Khawatir / Waspada): telinga agak turun, alis terangkat & mulut kecil cemberut, koin dipeluk erat di dada.
 * 3) sad (Sedih / Buruk): telinga turun lemas, mata berkaca-kaca & air mata, postur merosot, koin turun/jatuh ke bawah.
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

  // Head & body vertical shift to accentuate posture per mood
  const headY = mood === 'sad' ? 66 : mood === 'neutral' ? 62 : 56;
  const bodyY = mood === 'sad' ? 116 : 112;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 164 164"
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

      {/* Ground shadow */}
      <ellipse cx="82" cy="148" rx="46" ry="8" fill="#1E293B" opacity="0.16" />

      {/* Fluffy Tail (perky up when happy, tucked when worried, flat down when sad) */}
      {mood === 'happy' && (
        <motion.path
          d="M114 122 Q150 108 144 74 Q140 62 129 70 Q124 78 126 94 Q122 110 108 116 Z"
          fill={`url(#${furGradId})`}
          stroke="#C2410C"
          strokeWidth="1.5"
          animate={{ rotate: [-5, 9, -5] }}
          style={{ transformOrigin: '112px 120px' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />
      )}
      {mood === 'neutral' && (
        <path
          d="M114 126 Q142 126 136 106 Q132 98 124 104 Q122 114 108 120 Z"
          fill={`url(#${furGradId})`}
          stroke="#C2410C"
          strokeWidth="1.5"
        />
      )}
      {mood === 'sad' && (
        <path
          d="M114 134 Q146 140 144 128 Q140 120 126 126 Q118 128 110 128 Z"
          fill={`url(#${furGradId})`}
          stroke="#C2410C"
          strokeWidth="1.5"
        />
      )}

      {/* Chubby Sitting Body */}
      <ellipse
        cx="80"
        cy={bodyY}
        rx={mood === 'sad' ? 42 : 39}
        ry={mood === 'sad' ? 31 : 34}
        fill={`url(#${furGradId})`}
        stroke="#C2410C"
        strokeWidth="1.5"
      />
      <ellipse cx="80" cy={bodyY + 4} rx="25" ry="22" fill={`url(#${bellyGradId})`} />

      {/* Sitting Paws / Feet */}
      <ellipse cx="52" cy="140" rx="13" ry="8" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" />
      <ellipse cx="108" cy="140" rx="13" ry="8" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" />

      {/* EARS — Distinct per mood */}
      {mood === 'happy' && (
        <>
          {/* Tegak tinggi */}
          <path d="M43 44 L34 10 Q51 15 62 32 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M46 40 L39 17 Q50 21 58 32 Z" fill="#FBCFE8" />
          <path d="M117 44 L126 10 Q109 15 98 32 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M114 40 L121 17 Q110 21 102 32 Z" fill="#FBCFE8" />
        </>
      )}

      {mood === 'neutral' && (
        <>
          {/* Agak turun miring ke samping */}
          <path d="M41 54 L20 32 Q36 28 57 40 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M42 50 L27 35 Q37 33 52 42 Z" fill="#FBCFE8" />
          <path d="M119 54 L140 32 Q124 28 103 40 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M118 50 L133 35 Q123 33 108 42 Z" fill="#FBCFE8" />
        </>
      )}

      {mood === 'sad' && (
        <>
          {/* Turun lemas ke bawah */}
          <path d="M39 58 Q14 58 18 84 Q31 82 47 68 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M37 62 Q22 63 24 78 Q32 76 43 67 Z" fill="#FBCFE8" />
          <path d="M121 58 Q146 58 142 84 Q129 82 113 68 Z" fill={`url(#${furGradId})`} stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M123 62 Q138 63 136 78 Q128 76 117 67 Z" fill="#FBCFE8" />
        </>
      )}

      {/* Cat Head */}
      <ellipse
        cx="80"
        cy={headY}
        rx="42"
        ry="34"
        fill={`url(#${furGradId})`}
        stroke="#C2410C"
        strokeWidth="1.5"
      />

      {/* Forehead Tabby Stripes */}
      <path d={`M74 ${headY - 31} Q80 ${headY - 24} 76 ${headY - 19}`} stroke="#C2410C" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d={`M80 ${headY - 33} Q80 ${headY - 25} 80 ${headY - 18}`} stroke="#C2410C" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d={`M86 ${headY - 31} Q80 ${headY - 24} 84 ${headY - 19}`} stroke="#C2410C" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* Cream Muzzle */}
      <ellipse cx="80" cy={headY + 10} rx="20" ry="13" fill="#FFF7ED" opacity="0.95" />

      {/* Cheeks */}
      <ellipse cx="48" cy={headY + 8} rx="7" ry="4.5" fill="#FB7185" opacity={mood === 'happy' ? 0.65 : 0.3} />
      <ellipse cx="112" cy={headY + 8} rx="7" ry="4.5" fill="#FB7185" opacity={mood === 'happy' ? 0.65 : 0.3} />

      {/* Whiskers */}
      <g stroke="#9A3412" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
        <line x1="29" y1={headY + 2} x2="45" y2={headY + 5} />
        <line x1="27" y1={headY + 10} x2="45" y2={headY + 10} />
        <line x1="131" y1={headY + 2} x2="115" y2={headY + 5} />
        <line x1="133" y1={headY + 10} x2="115" y2={headY + 10} />
      </g>

      {/* FACIAL EXPRESSIONS */}
      {mood === 'happy' && (
        <>
          {/* Mata berbinar lebar + kilauan bintang */}
          <circle cx="59" cy={headY - 4} r="8.5" fill="#1E293B" />
          <circle cx="56" cy={headY - 7} r="3.4" fill="#FFFFFF" />
          <circle cx="63" cy={headY - 1} r="1.7" fill="#FEF08A" />
          <circle cx="101" cy={headY - 4} r="8.5" fill="#1E293B" />
          <circle cx="98" cy={headY - 7} r="3.4" fill="#FFFFFF" />
          <circle cx="105" cy={headY - 1} r="1.7" fill="#FEF08A" />

          {/* Senyum lebar bahagia */}
          <polygon points={`77,${headY + 5} 83,${headY + 5} 80,${headY + 9}`} fill="#F43F5E" />
          <path
            d={`M66 ${headY + 10} Q80 ${headY + 25} 94 ${headY + 10} Z`}
            fill="#991B1B"
            stroke="#7C2D12"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d={`M73 ${headY + 15} Q80 ${headY + 21} 87 ${headY + 15}`} fill="#FB7185" />

          {/* Sparkles */}
          <motion.g
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.15, 0.9] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          >
            <path d="M18 24 L20 29 L25 31 L20 33 L18 38 L16 33 L11 31 L16 29 Z" fill="#FACC15" />
            <path d="M148 22 L150 26 L154 28 L150 30 L148 34 L146 30 L142 28 L146 26 Z" fill="#69A984" />
          </motion.g>
        </>
      )}

      {mood === 'neutral' && (
        <>
          {/* Alis terangkat khawatir */}
          <path d={`M48 ${headY - 14} Q58 ${headY - 19} 68 ${headY - 12}`} stroke="#7C2D12" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d={`M112 ${headY - 14} Q102 ${headY - 19} 92 ${headY - 12}`} stroke="#7C2D12" strokeWidth="2.8" strokeLinecap="round" fill="none" />

          {/* Mata waspada */}
          <circle cx="59" cy={headY - 3} r="8" fill="#1E293B" />
          <circle cx="57" cy={headY - 6} r="2.6" fill="#FFFFFF" />
          <circle cx="101" cy={headY - 3} r="8" fill="#1E293B" />
          <circle cx="99" cy={headY - 6} r="2.6" fill="#FFFFFF" />

          {/* Mulut kecil cemberut */}
          <polygon points={`77,${headY + 5} 83,${headY + 5} 80,${headY + 9}`} fill="#F43F5E" />
          <path
            d={`M72 ${headY + 15} Q80 ${headY + 11} 88 ${headY + 15}`}
            stroke="#7C2D12"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tetes keringat khawatir */}
          <motion.path
            d={`M117 ${headY - 18} Q122 ${headY - 10} 117 ${headY - 5} Q112 ${headY - 10} 117 ${headY - 18}`}
            fill="#38BDF8"
            animate={{ y: [0, 3, 0], opacity: [0.75, 1, 0.75] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          />
        </>
      )}

      {mood === 'sad' && (
        <>
          {/* Alis turun sedih */}
          <path d={`M47 ${headY - 10} Q57 ${headY - 14} 67 ${headY - 17}`} stroke="#7C2D12" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d={`M113 ${headY - 10} Q103 ${headY - 14} 93 ${headY - 17}`} stroke="#7C2D12" strokeWidth="2.8" strokeLinecap="round" fill="none" />

          {/* Mata berkaca-kaca besar */}
          <circle cx="59" cy={headY - 3} r="8.5" fill="#1E293B" />
          <circle cx="56" cy={headY - 6} r="3" fill="#FFFFFF" />
          <ellipse cx="62" cy={headY + 2} rx="4" ry="2.2" fill="#93C5FD" opacity="0.9" />

          <circle cx="101" cy={headY - 3} r="8.5" fill="#1E293B" />
          <circle cx="98" cy={headY - 6} r="3" fill="#FFFFFF" />
          <ellipse cx="104" cy={headY + 2} rx="4" ry="2.2" fill="#93C5FD" opacity="0.9" />

          {/* Mulut sedih melengkung ke bawah */}
          <polygon points={`77,${headY + 5} 83,${headY + 5} 80,${headY + 9}`} fill="#F43F5E" />
          <path
            d={`M70 ${headY + 17} Q80 ${headY + 9} 90 ${headY + 17}`}
            stroke="#7C2D12"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Air mata menetes */}
          <motion.path
            d={`M51 ${headY + 5} Q55 ${headY + 14} 50 ${headY + 19} Q45 ${headY + 14} 51 ${headY + 5}`}
            fill="#60A5FA"
            animate={{ y: [0, 8, 15], opacity: [1, 0.85, 0] }}
            transition={{ repeat: Infinity, duration: 1.3 }}
          />
          <motion.path
            d={`M109 ${headY + 5} Q113 ${headY + 14} 108 ${headY + 19} Q103 ${headY + 14} 109 ${headY + 5}`}
            fill="#60A5FA"
            animate={{ y: [0, 8, 15], opacity: [1, 0.85, 0] }}
            transition={{ repeat: Infinity, duration: 1.3, delay: 0.35 }}
          />
        </>
      )}

      {/* Soft Green Scarf (Syal Hijau Lembut) */}
      <path
        d={`M44 ${headY + 24} Q80 ${headY + 38} 116 ${headY + 24} Q120 ${headY + 33} 114 ${headY + 39} Q80 ${headY + 52} 46 ${headY + 39} Q40 ${headY + 33} 44 ${headY + 24} Z`}
        fill={`url(#${scarfGradId})`}
        stroke="#2F5A43"
        strokeWidth="1.4"
      />
      <path
        d={`M95 ${headY + 35} L108 ${headY + 57} Q101 ${headY + 60} 94 ${headY + 56} L85 ${headY + 38} Z`}
        fill="#4A8C67"
        stroke="#2F5A43"
        strokeWidth="1.3"
      />
      <ellipse cx="90" cy={headY + 36} rx="8" ry="6" fill="#69A984" stroke="#2F5A43" strokeWidth="1.3" />

      {/* PAWS & GOLD COIN POSITION — Distinct per mood! */}
      {mood === 'happy' && (
        <>
          {/* Koin emas diangkat tinggi di samping atas dengan tangan terangkat gembira! */}
          <path
            d="M112 96 Q128 84 134 62"
            stroke="#EA580C"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M112 96 Q128 84 134 62"
            stroke="#FB923C"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <motion.g
            animate={{ y: [0, -4, 0], rotate: [-4, 4, -4] }}
            style={{ transformOrigin: '136px 46px' }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <circle cx="136" cy="46" r="16" fill={`url(#${coinGradId})`} stroke="#A16207" strokeWidth="1.8" />
            <circle cx="136" cy="46" r="11.5" fill="none" stroke="#FEF9C3" strokeWidth="1.2" />
            <text x="136" y="50" textAnchor="middle" fontSize="11" fontWeight="900" fill="#713F12" fontFamily="sans-serif">
              Rp
            </text>
          </motion.g>
          <ellipse cx="132" cy="60" rx="8" ry="7" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" />
          {/* Tangan kiri melambai senang */}
          <ellipse cx="44" cy="96" rx="9" ry="7" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" transform="rotate(-25 44 96)" />
        </>
      )}

      {mood === 'neutral' && (
        <>
          {/* Koin emas dipeluk erat di dada dengan kedua tangan */}
          <circle cx="80" cy="112" r="15" fill={`url(#${coinGradId})`} stroke="#A16207" strokeWidth="1.8" />
          <circle cx="80" cy="112" r="11" fill="none" stroke="#FEF9C3" strokeWidth="1.2" />
          <text x="80" y="116" textAnchor="middle" fontSize="11" fontWeight="900" fill="#713F12" fontFamily="sans-serif">
            Rp
          </text>
          {/* Kedua tangan memeluk erat ke tengah dada */}
          <ellipse cx="63" cy="112" rx="10" ry="7.5" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" transform="rotate(-12 63 112)" />
          <ellipse cx="97" cy="112" rx="10" ry="7.5" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" transform="rotate(12 97 112)" />
        </>
      )}

      {mood === 'sad' && (
        <>
          {/* Koin emas jatuh/dipegang lemas di bawah menyentuh tanah */}
          <ellipse cx="52" cy="126" rx="8" ry="6.5" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" transform="rotate(20 52 126)" />
          <ellipse cx="108" cy="126" rx="8" ry="6.5" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.4" transform="rotate(-20 108 126)" />
          <g transform="rotate(-18 80 142)">
            <ellipse cx="80" cy="142" rx="14" ry="11" fill={`url(#${coinGradId})`} stroke="#A16207" strokeWidth="1.8" />
            <text x="80" y="146" textAnchor="middle" fontSize="10" fontWeight="900" fill="#713F12" fontFamily="sans-serif">
              Rp
            </text>
          </g>
        </>
      )}
    </svg>
  );
};
