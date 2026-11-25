import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  Building2,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { GoldPortfolioDashboard } from '../gold/GoldPortfolioDashboard';
import { formatDateIndo, formatRupiah, getTodayDateInput, parseRupiahInput } from '../../lib/formatters';
import { ClassInvestment, ClassStatus, ManualAssetType, ManualInvestment } from '../../types';
import { CatFinnySvg } from '../mascot/CatFinnySvg';

type InvestTab = 'emas' | 'saham_kripto' | 'properti' | 'kelas';

export const InvestmentPage: React.FC = () => {
  const {
    manualInvestments,
    addManualInvestment,
    updateManualInvestment,
    deleteManualInvestment,
    classInvestments,
    addClassInvestment,
    updateClassInvestment,
    deleteClassInvestment,
    appCurrency,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<InvestTab>('emas');

  // Manual investment modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<ManualInvestment | null>(null);
  const [mName, setMName] = useState('');
  const [mType, setMType] = useState<ManualAssetType>('Saham');
  const [mInvestedRaw, setMInvestedRaw] = useState('');
  const [mCurrentRaw, setMCurrentRaw] = useState('');
  const [mDate, setMDate] = useState(getTodayDateInput());
  const [mNotes, setMNotes] = useState('');

  // Class investment modal state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInvestment | null>(null);
  const [cName, setCName] = useState('');
  const [cCostRaw, setCCostRaw] = useState('');
  const [cDate, setCDate] = useState(getTodayDateInput());
  const [cStatus, setCStatus] = useState<ClassStatus>('Belum');
  const [cNotes, setCNotes] = useState('');

  const filteredManualList = useMemo(() => {
    if (activeTab === 'properti') {
      return manualInvestments.filter((m) => m.asset_type === 'Properti');
    }
    if (activeTab === 'saham_kripto') {
      return manualInvestments.filter((m) => m.asset_type !== 'Properti');
    }
    return [];
  }, [manualInvestments, activeTab]);

  const manualTotals = useMemo(() => {
    const totalInvested = filteredManualList.reduce((s, m) => s + (Number(m.invested_amount) || 0), 0);
    const totalCurrent = filteredManualList.reduce((s, m) => s + (Number(m.current_value) || 0), 0);
    const diff = totalCurrent - totalInvested;
    return { totalInvested, totalCurrent, diff };
  }, [filteredManualList]);

  const openAddManual = (defaultType: ManualAssetType) => {
    setEditingManual(null);
    setMName('');
    setMType(defaultType);
    setMInvestedRaw('');
    setMCurrentRaw('');
    setMDate(getTodayDateInput());
    setMNotes('');
    setIsManualModalOpen(true);
  };

  const openEditManual = (item: ManualInvestment) => {
    setEditingManual(item);
    setMName(item.name);
    setMType(item.asset_type);
    setMInvestedRaw(String(item.invested_amount));
    setMCurrentRaw(String(item.current_value));
    setMDate(item.purchase_date);
    setMNotes(item.notes || '');
    setIsManualModalOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const invested = parseRupiahInput(mInvestedRaw);
    const current = mCurrentRaw ? parseRupiahInput(mCurrentRaw) : invested;
    if (!mName.trim() || invested <= 0) return;

    if (editingManual) {
      await updateManualInvestment(editingManual.id, {
        name: mName.trim(),
        asset_type: mType,
        invested_amount: invested,
        current_value: current,
        purchase_date: mDate,
        notes: mNotes.trim(),
      });
    } else {
      await addManualInvestment({
        name: mName.trim(),
        asset_type: mType,
        invested_amount: invested,
        current_value: current,
        purchase_date: mDate,
        notes: mNotes.trim(),
      });
    }
    setIsManualModalOpen(false);
  };

  const openAddClass = () => {
    setEditingClass(null);
    setCName('');
    setCCostRaw('');
    setCDate(getTodayDateInput());
    setCStatus('Belum');
    setCNotes('');
    setIsClassModalOpen(true);
  };

  const openEditClass = (item: ClassInvestment) => {
    setEditingClass(item);
    setCName(item.class_name);
    setCCostRaw(String(item.cost));
    setCDate(item.date);
    setCStatus(item.status);
    setCNotes(item.notes || '');
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseRupiahInput(cCostRaw);
    if (!cName.trim() || cost < 0) return;

    if (editingClass) {
      await updateClassInvestment(editingClass.id, {
        class_name: cName.trim(),
        cost,
        date: cDate,
        status: cStatus,
        notes: cNotes.trim(),
      });
    } else {
      await addClassInvestment({
        class_name: cName.trim(),
        cost,
        date: cDate,
        status: cStatus,
        notes: cNotes.trim(),
      });
    }
    setIsClassModalOpen(false);
  };

  const totalClassSpend = useMemo(
    () => classInvestments.reduce((s, c) => s + (Number(c.cost) || 0), 0),
    [classInvestments]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Portofolio Investasi Keluarga
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Emas (otomatis harga live), Saham & Kripto, Properti, serta Kelas (ilmu leher ke atas)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 gap-1.5 overflow-x-auto shadow-xs">
        {[
          { id: 'emas' as InvestTab, label: 'Emas', icon: Coins },
          { id: 'saham_kripto' as InvestTab, label: 'Saham & Kripto', icon: TrendingUp },
          { id: 'properti' as InvestTab, label: 'Properti', icon: Building2 },
          { id: 'kelas' as InvestTab, label: 'Kelas', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? 'bg-finance-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-cream-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EMAS */}
      {activeTab === 'emas' && <GoldPortfolioDashboard />}

      {/* TAB 2 & 3: SAHAM & KRIPTO / PROPERTI (Manual Investment) */}
      {(activeTab === 'saham_kripto' || activeTab === 'properti') && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Total Diinvestasikan
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatRupiah(manualTotals.totalInvested)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Total Nilai Saat Ini (Manual)
              </span>
              <p className="text-xl font-black text-finance-700 dark:text-finance-300 mt-1">
                {formatRupiah(manualTotals.totalCurrent)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Selisih Sederhana
              </span>
              <p
                className={`text-xl font-black mt-1 ${
                  manualTotals.diff >= 0 ? 'text-finance-600' : 'text-rose-600'
                }`}
              >
                {manualTotals.diff >= 0 ? '+' : ''}
                {formatRupiah(manualTotals.diff)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {activeTab === 'properti' ? 'Daftar Investasi Properti' : 'Daftar Investasi Saham & Kripto'}
                </h3>
                <p className="text-xs text-slate-500">
                  Catat modal awal dan perbarui nilai saat ini secara manual saat kamu mengecek
                </p>
              </div>
              <button
                onClick={() => openAddManual(activeTab === 'properti' ? 'Properti' : 'Saham')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Catat Aset Baru
              </button>
            </div>

            {filteredManualList.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="flex justify-center">
                  <CatFinnySvg mood="happy" size={88} idPrefix={`empty-${activeTab}`} />
                </div>
                <p className="text-xs text-slate-500">
                  Belum ada catatan {activeTab === 'properti' ? 'properti' : 'saham / kripto'}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredManualList.map((item) => {
                  const diff = (Number(item.current_value) || 0) - (Number(item.invested_amount) || 0);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-cream-50 dark:bg-slate-950/60 border border-finance-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {item.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-finance-100 text-finance-700 font-bold">
                            {item.asset_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Tanggal beli: {formatDateIndo(item.purchase_date)}
                          {item.notes ? ` • ${item.notes}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] text-slate-500">
                            Modal: <strong>{formatRupiah(item.invested_amount)}</strong> → Kini:{' '}
                            <strong className="text-slate-900 dark:text-white">{formatRupiah(item.current_value)}</strong>
                          </p>
                          <p className={`text-xs font-black ${diff >= 0 ? 'text-finance-600' : 'text-rose-600'}`}>
                            Selisih: {diff >= 0 ? '+' : ''}
                            {formatRupiah(diff)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditManual(item)}
                            className="p-2 rounded-lg text-slate-400 hover:text-finance-600 hover:bg-finance-50"
                            title="Edit / Update Nilai"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteManualInvestment(item.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: KELAS (Investasi Leher ke Atas / Ilmu — tanpa hitungan untung/rugi) */}
      {activeTab === 'kelas' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Kelas & Investasi Ilmu (Leher ke Atas)
              </h3>
              <p className="text-xs text-slate-500">
                Total biaya belajar tercatat: <strong className="text-finance-700 dark:text-finance-300">{formatRupiah(totalClassSpend)}</strong> ({classInvestments.length} kelas) — tanpa hitungan untung/rugi.
              </p>
            </div>
            <button
              onClick={openAddClass}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Catat Kelas Baru
            </button>
          </div>

          {classInvestments.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="flex justify-center">
                <CatFinnySvg mood="happy" size={88} idPrefix="empty-kelas" />
              </div>
              <p className="text-xs text-slate-500">
                Belum ada catatan kelas online/offline. Catat kelas yang kamu ikuti di sini!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {classInvestments.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl bg-cream-50 dark:bg-slate-950/60 border border-finance-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {cls.class_name}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          updateClassInvestment(cls.id, {
                            status: cls.status === 'Selesai' ? 'Belum' : 'Selesai',
                          })
                        }
                        className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          cls.status === 'Selesai'
                            ? 'bg-finance-100 text-finance-700 border-finance-300'
                            : 'bg-gold-100 text-amber-800 border-gold-300'
                        }`}
                      >
                        {cls.status === 'Selesai' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {cls.status}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDateIndo(cls.date)}
                      {cls.notes ? ` • ${cls.notes}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatRupiah(cls.cost)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditClass(cls)}
                        className="p-2 rounded-lg text-slate-400 hover:text-finance-600 hover:bg-finance-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteClassInvestment(cls.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Manual Investment */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsManualModalOpen(false)} className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finance-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingManual ? 'Edit Investasi Manual' : 'Catat Investasi Manual'}
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveManual} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Aset</label>
                <input
                  type="text"
                  required
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="Contoh: BBCA, BTC, Tanah Cikarang"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Jenis</label>
                  <select
                    value={mType}
                    onChange={(e) => setMType(e.target.value as ManualAssetType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                  >
                    <option value="Saham">Saham</option>
                    <option value="Kripto">Kripto</option>
                    <option value="Properti">Properti</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Tanggal Beli</label>
                  <input
                    type="date"
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Jumlah Investasi ({appCurrency})</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={mInvestedRaw ? Number(mInvestedRaw).toLocaleString('id-ID') : ''}
                    onChange={(e) => setMInvestedRaw(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="5.000.000"
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Nilai Saat Ini (Manual)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={mCurrentRaw ? Number(mCurrentRaw).toLocaleString('id-ID') : ''}
                    onChange={(e) => setMCurrentRaw(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Kosong = sama modal"
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-extrabold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  placeholder="Contoh: Beli di Bibit / Stockbit"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Class Investment */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsClassModalOpen(false)} className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finance-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingClass ? 'Edit Catatan Kelas' : 'Catat Kelas (Investasi Ilmu)'}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Contoh: Bootcamp Desain / Kelas Bisnis Online"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Biaya ({appCurrency})</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={cCostRaw ? Number(cCostRaw).toLocaleString('id-ID') : ''}
                    onChange={(e) => setCCostRaw(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="500.000"
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={cDate}
                    onChange={(e) => setCDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Belum', 'Selesai'] as ClassStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        cStatus === st
                          ? 'bg-finance-600 text-white border-finance-600'
                          : 'bg-cream-50 dark:bg-slate-950 border-finance-200 dark:border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  placeholder="Contoh: Jadwal tiap Sabtu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
