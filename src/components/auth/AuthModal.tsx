import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signUpWithEmail, isConfigured, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          onClose();
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Nama lengkap harus diisi');
          setIsSubmitting(false);
          return;
        }
        const res = await signUpWithEmail(email, password, fullName);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.needsEmailConfirmation) {
          setSuccessMsg('Pendaftaran berhasil! Supabase mewajibkan verifikasi: Silakan buka email Anda untuk konfirmasi, atau matikan "Confirm email" di Supabase Dashboard agar bisa langsung masuk.');
        } else {
          setSuccessMsg('Akun berhasil dibuat! Mengalihkan ke dashboard...');
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    {mode === 'login' ? 'Masuk ke Finance Tracking' : 'Buat Akun Baru'}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {isConfigured ? 'Terhubung dengan Supabase DB' : 'Mode Demo / Offline'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk (Login)
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar (Sign Up)
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                ✨ {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Kata Sandi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk Sekarang'
                  : 'Daftar Akun Baru'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Button */}
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">Ingin mencoba tanpa akun?</p>
              <button
                onClick={handleGuest}
                className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Lanjutkan Sebagai Tamu (Demo Mode)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
