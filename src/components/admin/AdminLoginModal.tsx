import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginModalProps {
  onLoginSuccess: () => void;
  onBackToApp: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onLoginSuccess,
  onBackToApp,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Check credentials strictly: admin / Polman@21
      if (username.trim() === 'admin' && password === 'Polman@21') {
        localStorage.setItem('ft_admin_authenticated', 'true');
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Username atau Password Admin tidak valid!');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="relative z-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
      >
        {/* Top Back Button */}
        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Aplikasi Utama</span>
        </button>

        {/* Header Branding */}
        <div className="text-center mb-8 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            Portal Login Admin
          </h1>
          <p className="text-xs text-slate-400">
            Masukan kredensial admin untuk mengakses panel kontrol
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs font-semibold text-rose-400"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Username Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Password Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 hover:from-emerald-500 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-600/25 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Memverifikasi Status...' : 'Masuk ke Halaman Admin'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
