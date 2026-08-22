import { Transaction } from '../types';
import { formatDateIndo, formatRupiah } from './formatters';

export const exportTransactionsToCSV = (transactions: Transaction[], filename = 'laporan-keuangan.csv') => {
  if (!transactions.length) {
    alert('Tidak ada data transaksi untuk diekspor.');
    return;
  }

  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah (Rp)', 'Catatan'];
  const rows = transactions.map((t) => [
    `"${formatDateIndo(t.date)}"`,
    `"${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
    `"${t.category_name || '-'}"`,
    `"${t.amount}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printFinancialReport = (
  transactions: Transaction[],
  stats: { totalIncome: number; totalExpense: number; totalBalance: number; monthName: string }
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk mencetak laporan.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Laporan Keuangan - Finance Tracking</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
        h1 { color: #047857; margin-bottom: 4px; }
        .sub { color: #64748b; margin-bottom: 24px; }
        .summary-grid { display: flex; gap: 16px; margin-bottom: 30px; }
        .card { flex: 1; padding: 16px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .card h4 { margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; }
        .card p { margin: 0; font-size: 20px; font-weight: bold; }
        .income { color: #059669; }
        .expense { color: #dc2626; }
        .balance { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; }
        .badge-income { color: #059669; font-weight: 600; }
        .badge-expense { color: #dc2626; font-weight: 600; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>📊 Laporan Keuangan - Finance Tracking</h1>
      <div class="sub">Periode: ${stats.monthName} | Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>

      <div class="summary-grid">
        <div class="card">
          <h4>Total Saldo</h4>
          <p class="balance">${formatRupiah(stats.totalBalance)}</p>
        </div>
        <div class="card">
          <h4>Total Pemasukan</h4>
          <p class="income">${formatRupiah(stats.totalIncome)}</p>
        </div>
        <div class="card">
          <h4>Total Pengeluaran</h4>
          <p class="expense">${formatRupiah(stats.totalExpense)}</p>
        </div>
      </div>

      <h3>Daftar Transaksi</h3>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Kategori</th>
            <th>Catatan</th>
            <th style="text-align: right;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${formatDateIndo(t.date)}</td>
              <td class="${t.type === 'income' ? 'badge-income' : 'badge-expense'}">
                ${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </td>
              <td>${t.category_name || '-'}</td>
              <td>${t.notes || '-'}</td>
              <td style="text-align: right; font-weight: 600;" class="${t.type === 'income' ? 'badge-income' : 'badge-expense'}">
                ${t.type === 'income' ? '+' : '-'}${formatRupiah(t.amount)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
        Dihasilkan secara otomatis oleh Finance Tracking App
      </div>

      <script>
        window.onload = () => { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
