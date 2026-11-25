import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { formatRupiah } from '../../lib/formatters';
import { Sparkles, AlertTriangle, AlertCircle, Heart, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { CatFinnySvg } from './CatFinnySvg';

interface AnimatedMascotProps {
  balance: number;
  onOpenSettings?: () => void;
}

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({ balance, onOpenSettings }) => {
  const { user } = useAuth();
  const { currentMonthVerdict } = useFinance();
  const [petCount, setPetCount] = useState(0);
  const [customQuote, setCustomQuote] = useState<string | null>(null);
  const prevMoodRef = useRef(currentMonthVerdict.mood);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return { text: 'Selamat Pagi ☀️', period: 'morning' };
    if (hour >= 11 && hour < 15) return { text: 'Selamat Siang 🌤️', period: 'afternoon' };
    if (hour >= 15 && hour < 18) return { text: 'Selamat Sore 🌇', period: 'evening' };
    return { text: 'Selamat Malam 🌙', period: 'night' };
  };

  const greeting = getTimeGreeting();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Keluarga Hebat';

  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const currentDayName = dayNames[now.getDay()];
  const currentDate = now.getDate();
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();

  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDate + 1);
  const dailyBalanceRate = Math.round(balance / remainingDays);

  // Ekspresi Finny mengikuti verdict keuangan bulanan (Baik -> happy, Waspada -> neutral, Buruk -> sad)
  const mood = currentMonthVerdict.mood;

  useEffect(() => {
    if (prevMoodRef.current !== 'happy' && mood === 'happy') {
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#4a8c67', '#69a984', '#d49a22', '#fb923c'],
        });
      } catch {
        // Ignore confetti errors
      }
    }
    prevMoodRef.current = mood;
  }, [mood]);

  const getMascotInfo = () => {
    switch (mood) {
      case 'happy':
        return {
          title: 'Finny Senang! Meow~ 🐾',
          statusText: `Verdict: ${currentMonthVerdict.level}`,
          badgeColor: 'bg-finance-100 text-finance-700 dark:bg-finance-900/40 dark:text-finance-300 border-finance-300/70',
          glowClass: 'from-finance-300/30 via-gold-200/20 to-transparent',
          defaultQuotes: [
            `Semua pos masih aman dalam anggaran! Sisa uang harianmu ${formatRupiah(dailyBalanceRate)}/hari.`,
            `Mantap! Tabungan dan pengeluaran bulan ini seimbang. Finny ikut senang!`,
            `Langkah kecil yang konsisten bikin keuangan keluarga makin tenang.`,
          ],
        };
      case 'neutral':
        return {
          title: 'Finny Agak Khawatir 😿',
          statusText: `Verdict: ${currentMonthVerdict.level}`,
          badgeColor: 'bg-gold-100 text-gold-600 dark:bg-amber-500/20 dark:text-amber-300 border-gold-300',
          glowClass: 'from-gold-200/35 via-orange-200/20 to-transparent',
          defaultQuotes: [
            currentMonthVerdict.reasons[0] || `Yuk pantau pos pengeluaranmu supaya tetap sesuai rencana bulan ini.`,
            `Sisa uang harian ${formatRupiah(dailyBalanceRate)}/hari untuk ${remainingDays} hari ke depan.`,
            `Cek pos mana yang mulai menipis sebelum akhir bulan tiba ya!`,
          ],
        };
      case 'sad':
        return {
          title: 'Finny Sedih... Meow 🥺',
          statusText: `Verdict: ${currentMonthVerdict.level}`,
          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300',
          glowClass: 'from-rose-300/25 via-orange-200/15 to-transparent',
          defaultQuotes: [
            currentMonthVerdict.reasons[0] || `Pengeluaran melebihi batas! Yuk rem dulu jajan yang belum mendesak.`,
            `Kita atur ulang prioritas bulan ini bareng Finny ya, pelan-pelan pasti membaik.`,
            `Catat semua pengeluaran sekecil apa pun agar kebocoran cepat ketahuan.`,
          ],
        };
    }
  };

  const mascotInfo = getMascotInfo();
  const currentQuote =
    customQuote || mascotInfo.defaultQuotes[petCount % mascotInfo.defaultQuotes.length];

  const handlePetMascot = () => {
    setPetCount((prev) => prev + 1);
    const petQuotes = {
      happy: [
        'Purrr~ Makasih sudah jaga keuangan keluarga tetap sehat! 🧡',
        'Finny sayang kamu! Koin emasnya dijaga baik-baik nih! 🪙',
        'Syal hijau baru Finny cocok kan sama dompet yang sehat? 💚',
      ],
      neutral: [
        'Meow~ Yuk cek halaman Budgeting supaya tahu pos mana yang perlu dijaga!',
        'Pelan-pelan kita bereskan rencana bulan ini bareng-bareng ya!',
      ],
      sad: [
        'Meow... Peluk Finny dulu. Besok kita mulai lebih hemat lagi ya 🫂',
        'Kalau biaya bulanan kurang, coba cek opsi Ambil dari Tabungan dengan bijak ya.',
      ],
    };
    const quotes = petQuotes[mood];
    setCustomQuote(quotes[petCount % quotes.length]);
    setTimeout(() => setCustomQuote(null), 4000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FCFBF7] to-finance-50/70 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950 border border-finance-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors duration-200">
      {/* Soft Background Glow */}
      <div
        className={`absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gradient-to-br ${mascotInfo.glowClass} blur-3xl pointer-events-none transition-all duration-700`}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 sm:gap-6">
        {/* Cat Mascot Container */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          <div className="mb-1.5 flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-finance-600/75 dark:text-slate-400">
              {currentDayName}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white leading-none">
                {currentDate}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
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
                ? { y: [0, -6, 0] }
                : mood === 'sad'
                ? { y: [0, 2, 0] }
                : { y: [0, -3, 0] }
            }
            transition={{
              repeat: Infinity,
              duration: mood === 'happy' ? 2.6 : mood === 'sad' ? 1.8 : 2.8,
              ease: 'easeInOut',
            }}
          >
            <CatFinnySvg mood={mood} size={136} idPrefix="homeFinnyCat" />
          </motion.div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 hover:text-finance-600 transition-colors">
            <Heart className="w-3 h-3 text-orange-400 inline animate-pulse" />
            Elus Finny si Kucing
          </span>
        </div>

        {/* Speech & Status Area */}
        <div className="flex-1 w-full space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-finance-100 dark:border-slate-800/80">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-finance-600 dark:text-finance-400 block sm:inline-block mr-1.5">
                {greeting.text}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight truncate inline-block">
                Halo, <span className="text-finance-600 dark:text-finance-300">{displayName}</span>!
              </h2>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-finance-50 dark:bg-slate-800 hover:bg-finance-100 dark:hover:bg-slate-700 text-finance-700 dark:text-slate-200 text-xs font-bold transition-all border border-finance-200 dark:border-slate-700 shrink-0"
                title="Pengaturan Profil & Budgeting"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profil & Budget</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white">
                {mascotInfo.title}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${mascotInfo.badgeColor} flex items-center gap-1`}>
                {mood === 'happy' && <Sparkles className="w-3 h-3" />}
                {mood === 'neutral' && <AlertTriangle className="w-3 h-3" />}
                {mood === 'sad' && <AlertCircle className="w-3 h-3" />}
                {mascotInfo.statusText}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Sisa Uang Harian ({remainingDays} hari)
              </span>
              <span
                className={`text-sm sm:text-base font-black ${
                  dailyBalanceRate >= 0
                    ? 'text-finance-700 dark:text-finance-300'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatRupiah(dailyBalanceRate)}/hari
              </span>
            </div>
          </div>

          {/* Speech Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="relative p-3.5 rounded-2xl bg-cream-100 dark:bg-slate-800/80 border border-finance-200/70 dark:border-slate-700/60"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg select-none">🐾</span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {currentQuote}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
