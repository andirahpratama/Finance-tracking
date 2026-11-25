import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Search,
  X,
  Info,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { DebtItem, DebtKind, DebtStatus } from '../../types';
import { formatDateIndo, formatRupiah, getTodayDateInput, parseRupiahInput } from '../../lib/formatters';
import { CatFinnySvg } from '../mascot/CatFinnySvg';

export const UtangPiutangPage: React.FC = () => {
  const { debts, addDebt, updateDebt, deleteDebt, toggleDebtStatus, appCurrency } = useFinance();

  const [statusFilter, setStatusFilter] = useState<'all' | DebtStatus>('all');
  const [kindFilter, setKindFilter] = useState<'all' | DebtKind>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [kind, setKind] = useState<DebtKind>('utang');
  const [personName, setPersonName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [date, setDate] = useState(getTodayDateInput());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<DebtStatus>('belum_lunas');

  const totals = useMemo(() => {
    const unpaidUtang = debts
      .filter((d) => d.kind === 'utang' && d.status === 'belum_lunas')
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const unpaidPiutang = debts
      .filter((d) => d.kind === 'piutang' && d.status === 'belum_lunas')
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return { unpaidUtang, unpaidPiutang };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (kindFilter !== 'all' && d.kind !== kindFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (
          !d.person_name.toLowerCase().includes(q) &&
          !(d.notes || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [debts, statusFilter, kindFilter, searchTerm]);

  const openAdd = () => {
    setEditingDebt(null);
    setKind('utang');
    setPersonName('');
    setAmountRaw('');
    setDate(getTodayDateInput());
    setDueDate('');
    setNotes('');
    setStatus('belum_lunas');
    setIsModalOpen(true);
  };

  const openEdit = (item: DebtItem) => {
    setEditingDebt(item);
    setKind(item.kind);
    setPersonName(item.person_name);
    setAmountRaw(String(item.amount));
    setDate(item.date);
    setDueDate(item.due_date || '');
    setNotes(item.notes || '');
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRupiahInput(amountRaw);
    if (!personName.trim() || amount <= 0) return;

    if (editingDebt) {
      await updateDebt(editingDebt.id, {
        kind,
        person_name: personName.trim(),
        amount,
        date,
        due_date: dueDate || undefined,
        notes: notes.trim(),
        status,
      });
    } else {
      await addDebt({
        kind,
        person_name: personName.trim(),
        amount,
        date,
        due_date: dueDate || undefined,
        notes: notes.trim(),
        status,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-finance-600 text-white shadow-sm">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Buku Utang & Piutang
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catatan utang & piutang terpisah dari pemasukan/pengeluaran harian
            </p>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Catat Utang / Piutang
        </button>
      </div>

      {/* Info Guardrail */}
      <div className="p-3.5 rounded-2xl bg-finance-50 dark:bg-finance-950/30 border border-finance-200 dark:border-finance-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-finance-600 shrink-0 mt-0.5" />
        <span>
          Catatan di buku ini <strong>tidak dihitung sebagai pemasukan atau pengeluaran</strong> sehingga laporan arus kas bulananmu tetap rapi.
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-rose-600 block">
            Total Utang Belum Lunas (Kewajiban Kita)
          </span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
            {formatRupiah(totals.unpaidUtang)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-finance-900/40 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-finance-700 block">
            Total Piutang Belum Lunas (Uang Kita di Orang)
          </span>
          <p className="text-2xl font-black text-finance-700 dark:text-finance-300 mt-1">
            {formatRupiah(totals.unpaidPiutang)}
          </p>
        </div>
      </div>

      {/* Filters & List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama orang atau catatan..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-cream-100 dark:bg-slate-950 border border-finance-100 dark:border-slate-800">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'belum_lunas', label: 'Belum Lunas' },
              { id: 'lunas', label: 'Lunas' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                  statusFilter === s.id
                    ? 'bg-finance-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-cream-100 dark:bg-slate-950 border border-finance-100 dark:border-slate-800">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'utang', label: 'Utang' },
              { id: 'piutang', label: 'Piutang' },
            ].map((k) => (
              <button
                key={k.id}
                onClick={() => setKindFilter(k.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                  kindFilter === k.id
                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {filteredDebts.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="flex justify-center">
              <CatFinnySvg mood="happy" size={88} idPrefix="debtEmptyCat" />
            </div>
            <p className="text-xs text-slate-500">
              Belum ada catatan utang atau piutang yang cocok dengan filter ini.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDebts.map((item) => {
              const isLunas = item.status === 'lunas';
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLunas
                      ? 'bg-slate-50/70 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 opacity-80'
                      : 'bg-cream-50/70 dark:bg-slate-950/70 border-finance-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                          item.kind === 'utang'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-finance-100 text-finance-700'
                        }`}
                      >
                        {item.kind === 'utang' ? 'Utang' : 'Piutang'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {item.person_name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isLunas
                            ? 'bg-finance-100 text-finance-700'
                            : 'bg-gold-100 text-amber-800'
                        }`}
                      >
                        {isLunas ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isLunas ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Tanggal: {formatDateIndo(item.date)}
                      {item.due_date ? ` • Jatuh tempo: ${formatDateIndo(item.due_date)}` : ''}
                      {item.notes ? ` • ${item.notes}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={`text-base font-black ${
                        item.kind === 'utang' ? 'text-rose-600' : 'text-finance-700 dark:text-finance-300'
                      }`}
                    >
                      {formatRupiah(item.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleDebtStatus(item.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                          isLunas
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'border-finance-300 bg-finance-50 text-finance-700 hover:bg-finance-100'
                        }`}
                      >
                        {isLunas ? 'Buka Lagi' : 'Tandai Lunas'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-2 rounded-lg text-slate-400 hover:text-finance-600 hover:bg-finance-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDebt(item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finance-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingDebt ? 'Edit Catatan Utang/Piutang' : 'Catat Utang / Piutang Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKind('utang')}
                  className={`py-2.5 rounded-xl text-xs font-bold border ${
                    kind === 'utang'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-cream-50 dark:bg-slate-950 border-finance-200 dark:border-slate-800'
                  }`}
                >
                  Utang (Saya Berutang)
                </button>
                <button
                  type="button"
                  onClick={() => setKind('piutang')}
                  className={`py-2.5 rounded-xl text-xs font-bold border ${
                    kind === 'piutang'
                      ? 'bg-finance-600 text-white border-finance-600'
                      : 'bg-cream-50 dark:bg-slate-950 border-finance-200 dark:border-slate-800'
                  }`}
                >
                  Piutang (Dipinjam Orang)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Nama Orang / Pihak</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Contoh: Mas Budi, Kak Rina"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Jumlah ({appCurrency})</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amountRaw ? Number(amountRaw).toLocaleString('id-ID') : ''}
                  onChange={(e) => setAmountRaw(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="50.000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-sm font-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Jatuh Tempo (Opsional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Talangan beli susu anak"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
