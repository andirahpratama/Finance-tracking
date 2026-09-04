import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MascotMood } from '../../types';
import { formatRupiah } from '../../lib/formatters';
import { Sparkles, AlertTriangle, Smile, Heart, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface AnimatedMascotProps {
  balance: number;
  onOpenSettings?: () => void;
}

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({ balance, onOpenSettings }) => {
  const { user } = useAuth();
  const { balanceThresholds } = useFinance();
  const [petCount, setPetCount] = useState(0);
  const [customQuote, setCustomQuote] = useState<string | null>(null);
  const prevBalanceRef = useRef<number>(balance);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return { text: 'Selamat Pagi ☀️', period: 'morning' };
    if (hour >= 11 && hour < 15) return { text: 'Selamat Siang 🌤️', period: 'afternoon' };
    if (hour >= 15 && hour < 18) return { text: 'Selamat Sore 🌇', period: 'evening' };
    return { text: 'Selamat Malam 🌙', period: 'night' };
  };

  const greeting = getTimeGreeting();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Teman Keuangan';

  // Current date & Remaining days calculation in current month
  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentDayName = dayNames[now.getDay()];
  const currentDate = now.getDate();
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();

  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDate + 1);
  const dailyBalanceRate = Math.round(balance / remainingDays);

  // Determine mood based on Daily Balance Rate against per-user thresholds:
  // > safe threshold (default 100k/day) : Happy / Tersenyum Senang
  // >= warning threshold && <= safe (default 50k - 100k/day) : Neutral / Datar Sedikit Panik
  // < warning threshold (default < 50k/day) : Sad / Sedih Menangis
  const mood: MascotMood = dailyBalanceRate > balanceThresholds.safe
    ? 'happy'
    : dailyBalanceRate >= balanceThresholds.warning
    ? 'neutral'
    : 'sad';

  // Trigger celebratory confetti when daily rate crosses above safe threshold
  useEffect(() => {
    const prevRate = Math.round(prevBalanceRef.current / remainingDays);
    if (prevRate <= balanceThresholds.safe && dailyBalanceRate > balanceThresholds.safe) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#FBBF24', '#60A5FA'],
        });
      } catch {
        // Ignore confetti if not in browser window
      }
    }
    prevBalanceRef.current = balance;
  }, [balance, dailyBalanceRate, remainingDays, balanceThresholds.safe]);

  // Mascot quotes based on mood & daily balance rate
  const getMascotInfo = () => {
    switch (mood) {
      case 'happy':
        return {
          title: 'Finny Tersenyum Senang! 🎉',
          statusText: 'Dompet Super Sehat',
          badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
          glowClass: 'from-emerald-500/20 via-teal-500/10 to-transparent',
          defaultQuotes: [
            `Sisa saldomu ${formatRupiah(dailyBalanceRate)}/hari! Dompetmu aman, Finny ikut gembira! 🥳`,
            `Gaya hidup hematmu mantap! Masih tersisa ${remainingDays} hari di bulan ini! 💰`,
            `Kerja kerasmu membuahkan hasil, Finny bangga padamu! ✨`,
            `Pertahankan alokasi keuangan yang sehat ini ya! 🚀`,
          ],
        };
      case 'neutral':
        return {
          title: 'Finny Datar & Agak Panik 🧐',
          statusText: 'Kondisi Waspada',
          badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40',
          glowClass: 'from-amber-500/20 via-yellow-500/10 to-transparent',
          defaultQuotes: [
            `Sisa saldomu ${formatRupiah(dailyBalanceRate)}/hari (${remainingDays} hari tersisa). Agak pas-pasan nih, tahan jajan ya! ☕`,
            `Finny keringat dingin nih... Prioritaskan kebutuhan pokok dulu minggu ini! 📝`,
            `Cek pengeluaran kecil harian, seringkali yang bikin bocor halus! 🔍`,
            `Tetap tenang dan kontrol pengeluaran harianmu agar tidak jebol! 👍`,
          ],
        };
      case 'sad':
        return {
          title: 'Finny Sedih & Menangis! 🥺',
          statusText: 'Kondisi Menipis / Kritis',
          badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40',
          glowClass: 'from-rose-500/20 via-red-500/10 to-transparent',
          defaultQuotes: [
            `Sisa saldomu tinggal ${formatRupiah(dailyBalanceRate)}/hari untuk ${remainingDays} hari ke depan! Finny sedih menangis! 🚨`,
            `Huhu Finny deg-degan berat! Hindari checkout keranjang dulu ya! 🛒❌`,
            `Waktunya mode pejuang hemat ala anak kos sampai gajian tiba! 💪`,
            `Yuk catat setiap pengeluaran sekecil apapun agar saldo tidak minus! 📋`,
          ],
        };
    }
  };

  const mascotInfo = getMascotInfo();

  // Pick quote based on date & clicks
  const currentQuote =
    customQuote || mascotInfo.defaultQuotes[(petCount + Math.abs(Math.floor(balance / 100000))) % mascotInfo.defaultQuotes.length];

  const handlePetMascot = () => {
    setPetCount((prev) => prev + 1);
    const petQuotes = {
      happy: [
        'Hehe geli! Makasih traktiran keuangannya yang sehat! ✨',
        'Kamu master pengelola uang yang hebat! 🏆',
        'Finny sayang kamu, dompet tebal senyum lebar! 💚',
      ],
      neutral: [
        'Ayo semangat tambah pemasukan hari ini! 📈',
        'Finny percaya kamu bisa bikin saldo harian naik ke zona hijau! 🎯',
        'Yuk tahan dulu godaan promo diskon yang gak perlu! 🛡️',
      ],
      sad: [
        'Huhu tolong selamatkan dompet kita... 💧',
        'Finny butuh suntikan dana pemasukan baru! 🪙',
        'Peluk Finny... kita pasti bisa lewati masa krisis ini! 🫂',
      ],
    };
    const quotes = petQuotes[mood];
    setCustomQuote(quotes[petCount % quotes.length]);
    setTimeout(() => setCustomQuote(null), 4000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-sm dark:shadow-xl transition-colors duration-200">
      {/* Background Ambient Glow */}
      <div
        className={`absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gradient-to-br ${mascotInfo.glowClass} blur-3xl pointer-events-none transition-all duration-700`}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Animated Mascot Character Container */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          {/* Date & Day Badge above Finny */}
          <div className="mb-2 flex flex-col items-center gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {currentDayName}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                {currentDate}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {currentMonth} {currentYear}
              </span>
            </div>
          </div>

          <motion.div
            className="cursor-pointer select-none relative"
            onClick={handlePetMascot}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              mood === 'happy'
                ? { y: [0, -8, 0], rotate: [0, 1.5, -1.5, 0] }
                : mood === 'sad'
                ? { x: [-1.5, 1.5, -1.5, 1.5, 0], y: [0, 2, 0] }
                : { y: [0, -3, 0], rotate: [-0.5, 0.5, -0.5] }
            }
            transition={{
              repeat: Infinity,
              duration: mood === 'happy' ? 2.5 : mood === 'sad' ? 0.8 : 2.5,
              ease: 'easeInOut',
            }}
          >
            {/* Mascot SVG Vector */}
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              className="drop-shadow-2xl overflow-visible"
            >
              <defs>
                {/* Body Gradients */}
                <linearGradient id="mascotHappyBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="60%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                <linearGradient id="mascotNeutralBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="60%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <linearGradient id="mascotSadBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FB7185" />
                  <stop offset="60%" stopColor="#F43F5E" />
                  <stop offset="100%" stopColor="#BE123C" />
                </linearGradient>

                <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="100%" stopColor="#EAB308" />
                </linearGradient>

                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Shadow underneath */}
              <ellipse cx="70" cy="132" rx="42" ry="7" fill="#020617" opacity="0.3" />

              {/* Ears */}
              {mood === 'happy' && (
                <>
                  {/* Left Ear */}
                  <motion.ellipse
                    cx="40"
                    cy="36"
                    rx="16"
                    ry="20"
                    fill="url(#mascotHappyBody)"
                    transform="rotate(-20 40 36)"
                    animate={{ rotate: [-20, -25, -20] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <ellipse cx="40" cy="36" rx="9" ry="12" fill="#A7F3D0" transform="rotate(-20 40 36)" />
                  {/* Right Ear */}
                  <motion.ellipse
                    cx="100"
                    cy="36"
                    rx="16"
                    ry="20"
                    fill="url(#mascotHappyBody)"
                    transform="rotate(20 100 36)"
                    animate={{ rotate: [20, 25, 20] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <ellipse cx="100" cy="36" rx="9" ry="12" fill="#A7F3D0" transform="rotate(20 100 36)" />
                </>
              )}

              {mood === 'neutral' && (
                <>
                  <ellipse cx="42" cy="38" rx="15" ry="18" fill="url(#mascotNeutralBody)" transform="rotate(-15 42 38)" />
                  <ellipse cx="42" cy="38" rx="8" ry="10" fill="#FDE68A" transform="rotate(-15 42 38)" />
                  <ellipse cx="98" cy="38" rx="15" ry="18" fill="url(#mascotNeutralBody)" transform="rotate(15 98 38)" />
                  <ellipse cx="98" cy="38" rx="8" ry="10" fill="#FDE68A" transform="rotate(15 98 38)" />
                </>
              )}

              {mood === 'sad' && (
                <>
                  {/* Drooping Ears */}
                  <motion.ellipse
                    cx="36"
                    cy="52"
                    rx="15"
                    ry="20"
                    fill="url(#mascotSadBody)"
                    transform="rotate(-55 36 52)"
                    animate={{ rotate: [-55, -60, -55] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <ellipse cx="36" cy="52" rx="8" ry="12" fill="#FECDD3" transform="rotate(-55 36 52)" />
                  <motion.ellipse
                    cx="104"
                    cy="52"
                    rx="15"
                    ry="20"
                    fill="url(#mascotSadBody)"
                    transform="rotate(55 104 52)"
                    animate={{ rotate: [55, 60, 55] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <ellipse cx="104" cy="52" rx="8" ry="12" fill="#FECDD3" transform="rotate(55 104 52)" />
                </>
              )}

              {/* Main Body */}
              <circle
                cx="70"
                cy="76"
                r="48"
                fill={
                  mood === 'happy'
                    ? 'url(#mascotHappyBody)'
                    : mood === 'neutral'
                    ? 'url(#mascotNeutralBody)'
                    : 'url(#mascotSadBody)'
                }
              />

              {/* Tummy Patch */}
              <ellipse
                cx="70"
                cy="88"
                rx="28"
                ry="24"
                fill="#FFFFFF"
                opacity={mood === 'happy' ? 0.35 : mood === 'neutral' ? 0.3 : 0.25}
              />

              {/* Coin Emblem on Chest */}
              <circle cx="70" cy="88" r="12" fill="url(#coinGrad)" stroke="#B45309" strokeWidth="1.5" />
              <text
                x="70"
                y="92"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#78350F"
                fontFamily="sans-serif"
              >
                Rp
              </text>

              {/* Rosy Cheeks */}
              <ellipse
                cx="42"
                cy="78"
                rx="8"
                ry="5"
                fill={mood === 'happy' ? '#F472B6' : mood === 'neutral' ? '#FBBF24' : '#FDA4AF'}
                opacity={mood === 'happy' ? 0.8 : 0.5}
              />
              <ellipse
                cx="98"
                cy="78"
                rx="8"
                ry="5"
                fill={mood === 'happy' ? '#F472B6' : mood === 'neutral' ? '#FBBF24' : '#FDA4AF'}
                opacity={mood === 'happy' ? 0.8 : 0.5}
              />

              {/* FACIAL EXPRESSIONS */}
              {mood === 'happy' && (
                <>
                  {/* Happy Arch Eyes (^_^) */}
                  <path
                    d="M48 64 Q56 52 64 64"
                    stroke="#022C22"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M76 64 Q84 52 92 64"
                    stroke="#022C22"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Wide Cheerful Mouth */}
                  <path
                    d="M56 74 Q70 92 84 74"
                    stroke="#022C22"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="#991B1B"
                  />
                  {/* Little Tongue */}
                  <path
                    d="M63 80 Q70 88 77 80"
                    fill="#F472B6"
                  />

                  {/* Floating Sparkles & Coins */}
                  <motion.g
                    animate={{ y: [-3, 3, -3], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <path
                      d="M20 30 L22 35 L27 37 L22 39 L20 44 L18 39 L13 37 L18 35 Z"
                      fill="#FBBF24"
                      filter="url(#glowEffect)"
                    />
                    <path
                      d="M120 28 L122 32 L126 34 L122 36 L120 40 L118 36 L114 34 L118 32 Z"
                      fill="#34D399"
                      filter="url(#glowEffect)"
                    />
                    <circle cx="118" cy="62" r="7" fill="url(#coinGrad)" stroke="#B45309" strokeWidth="1" />
                    <text x="118" y="65" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#78350F">
                      $
                    </text>
                  </motion.g>
                </>
              )}

              {mood === 'neutral' && (
                <>
                  {/* Panicked / Concerned Eyebrows */}
                  <path d="M48 54 L62 57" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M92 54 L78 57" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Wide Concerned Eyes (o_o) */}
                  <circle cx="56" cy="63" r="5.5" fill="#1E293B" />
                  <circle cx="57.5" cy="61.5" r="1.8" fill="#FFFFFF" />
                  <circle cx="84" cy="63" r="5.5" fill="#1E293B" />
                  <circle cx="85.5" cy="61.5" r="1.8" fill="#FFFFFF" />

                  {/* Flat Wobbly Panic Mouth */}
                  <path
                    d="M60 76 Q70 79 80 76"
                    stroke="#1E293B"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Animated Sweat Drop on Temple (Datar Sedikit Panik) */}
                  <motion.path
                    d="M104 50 Q108 58 104 63 Q100 58 104 50"
                    fill="#38BDF8"
                    animate={{ y: [0, 4, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  />
                </>
              )}

              {mood === 'sad' && (
                <>
                  {/* Sad Eyebrows */}
                  <path d="M48 54 L60 51" stroke="#4C0519" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M92 54 L80 51" stroke="#4C0519" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Sad Drooping Eyes (T_T) */}
                  <path
                    d="M48 60 Q56 68 64 62"
                    stroke="#4C0519"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M76 62 Q84 68 92 60"
                    stroke="#4C0519"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Crying Wobbly Sad Mouth */}
                  <path
                    d="M58 80 Q70 70 82 80"
                    stroke="#4C0519"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Animated Tear Drops Falling from both eyes */}
                  <motion.path
                    d="M102 54 Q107 64 102 70 Q97 64 102 54"
                    fill="#0284C7"
                    animate={{ y: [0, 10, 18], opacity: [1, 0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeIn' }}
                  />
                  <motion.path
                    d="M38 56 Q43 66 38 72 Q33 66 38 56"
                    fill="#0284C7"
                    animate={{ y: [0, 10, 18], opacity: [1, 0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.3, ease: 'easeIn', delay: 0.3 }}
                  />
                </>
              )}
            </svg>
          </motion.div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 hover:text-emerald-500 transition-colors">
            <Heart className="w-3 h-3 text-pink-500 inline animate-pulse" />
            Klik Finny untuk interaksi
          </span>
        </div>

        {/* Mascot Speech & Status Card */}
        <div className="flex-1 w-full space-y-3 min-w-0">
          {/* User Friendly Greeting Banner & Settings Action Button */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block sm:inline-block mr-1.5">
                {greeting.text}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate inline-block">
                Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">{displayName}</span>! 👋
              </h2>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
                title="Pengaturan Profil & Finny"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Set Pengaturan</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">{mascotInfo.title}</span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${mascotInfo.badgeColor} flex items-center gap-1`}
              >
                {mood === 'happy' && <Sparkles className="w-3 h-3" />}
                {mood === 'neutral' && <Smile className="w-3 h-3" />}
                {mood === 'sad' && <AlertTriangle className="w-3 h-3" />}
                {mascotInfo.statusText}
              </span>
            </div>

            {/* Daily Balance Rate Indicator Badge */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Sisa Saldo Harian</span>
              <div className="flex items-baseline justify-end gap-1">
                <span
                  className={`text-base sm:text-lg font-extrabold tracking-tight ${
                    mood === 'happy'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : mood === 'neutral'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatRupiah(dailyBalanceRate)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">/ hari</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Sisa {remainingDays} hari di bulan ini
              </span>
            </div>
          </div>

          {/* Dialogue Speech Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="relative p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-inner"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl select-none">💬</span>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {currentQuote}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress / Mood indicator bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className={dailyBalanceRate < balanceThresholds.warning ? 'text-rose-500 font-bold' : ''}>
                Kritis (&lt;{formatRupiah(balanceThresholds.warning)}/h)
              </span>
              <span className={dailyBalanceRate >= balanceThresholds.warning && dailyBalanceRate <= balanceThresholds.safe ? 'text-amber-500 font-bold' : ''}>
                Panik / Datar
              </span>
              <span className={dailyBalanceRate > balanceThresholds.safe ? 'text-emerald-500 font-bold' : ''}>
                Senang (&gt;{formatRupiah(balanceThresholds.safe)}/h)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (dailyBalanceRate / balanceThresholds.warning) * 33.3))}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{
                  width: `${
                    dailyBalanceRate > balanceThresholds.warning
                      ? Math.min(33.3, ((dailyBalanceRate - balanceThresholds.warning) / (balanceThresholds.safe - balanceThresholds.warning)) * 33.3)
                      : 0
                  }%`,
                }}
              />
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{
                  width: `${
                    dailyBalanceRate > balanceThresholds.safe
                      ? Math.min(33.4, ((dailyBalanceRate - balanceThresholds.safe) / (balanceThresholds.safe * 2)) * 33.4)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
