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

  // Calculate Category Breakdowns
  const categoryMap: { [key: string]: { name: string; type: string; total: number; color: string } } = {};

  transactions.forEach((t) => {
    const key = `${t.type}_${t.category_name || 'Lainnya'}`;
    if (!categoryMap[key]) {
      categoryMap[key] = {
        name: t.category_name || 'Lainnya',
        type: t.type,
        total: 0,
        color: t.category_color || (t.type === 'income' ? '#10b981' : '#f43f5e'),
      };
    }
    categoryMap[key].total += Number(t.amount) || 0;
  });

  const categoryList = Object.values(categoryMap).sort((a, b) => b.total - a.total);
  const expenseCategories = categoryList.filter((c) => c.type === 'expense');
  const incomeCategories = categoryList.filter((c) => c.type === 'income');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Laporan Keuangan - Finance Tracking</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
        .title { color: #059669; font-size: 24px; font-weight: 800; margin: 0; }
        .sub { color: #64748b; font-size: 13px; margin-top: 4px; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .card { padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .card h4 { margin: 0 0 6px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .card p { margin: 0; font-size: 20px; font-weight: 800; }
        .income { color: #059669; }
        .expense { color: #e11d48; }
        .balance { color: #0284c7; }

        .section-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #059669; padding-left: 10px; }
        
        .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
        .chart-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; bg: #ffffff; }
        .bar-item { margin-bottom: 12px; }
        .bar-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
        .bar-bg { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }

        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 700; color: #475569; font-size: 12px; uppercase; }
        .badge-income { color: #059669; font-weight: 700; }
        .badge-expense { color: #e11d48; font-weight: 700; }
        
        .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-t: 1px solid #e2e8f0; padding-top: 16px; }

        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">📊 Finance Tracking - Laporan Keuangan</div>
          <div class="sub">Periode Laporan: <strong>${stats.monthName}</strong> | Total Transaksi: ${transactions.length} | Dicetak: ${new Date().toLocaleString('id-ID')}</div>
        </div>
        <button onclick="window.print()" class="no-print" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Cetak / Download PDF</button>
      </div>

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

      <!-- Grafik & Breakdown Kategori -->
      <div class="section-title">Visualisasi Analisis Kategori</div>
      <div class="chart-grid">
        <!-- Expense Breakdown -->
        <div class="chart-card">
          <h4 style="margin-top: 0; color: #e11d48; font-size: 13px;">Pengeluaran per Kategori</h4>
          ${expenseCategories.length === 0 ? '<p style="font-size:12px; color:#94a3b8;">Tidak ada data pengeluaran</p>' : ''}
          ${expenseCategories.map((c) => {
            const percent = stats.totalExpense > 0 ? Math.round((c.total / stats.totalExpense) * 100) : 0;
            return `
              <div class="bar-item">
                <div class="bar-label">
                  <span>${c.name} (${percent}%)</span>
                  <span>${formatRupiah(c.total)}</span>
                </div>
                <div class="bar-bg">
                  <div class="bar-fill" style="width: ${percent}%; background-color: ${c.color || '#f43f5e'};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Income Breakdown -->
        <div class="chart-card">
          <h4 style="margin-top: 0; color: #059669; font-size: 13px;">Pemasukan per Kategori</h4>
          ${incomeCategories.length === 0 ? '<p style="font-size:12px; color:#94a3b8;">Tidak ada data pemasukan</p>' : ''}
          ${incomeCategories.map((c) => {
            const percent = stats.totalIncome > 0 ? Math.round((c.total / stats.totalIncome) * 100) : 0;
            return `
              <div class="bar-item">
                <div class="bar-label">
                  <span>${c.name} (${percent}%)</span>
                  <span>${formatRupiah(c.total)}</span>
                </div>
                <div class="bar-bg">
                  <div class="bar-fill" style="width: ${percent}%; background-color: ${c.color || '#10b981'};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- History Transaksi Table -->
      <div class="section-title">Riwayat Transaksi Keuangan</div>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Kategori</th>
            <th>Keterangan / Catatan</th>
            <th style="text-align: right;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Tidak ada catatan transaksi pada periode ini.</td></tr>' : ''}
          ${transactions.map(t => `
            <tr>
              <td>${formatDateIndo(t.date)}</td>
              <td class="${t.type === 'income' ? 'badge-income' : 'badge-expense'}">
                ${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </td>
              <td>${t.category_name || '-'}</td>
              <td>${t.notes || '-'}</td>
              <td style="text-align: right; font-weight: 700;" class="${t.type === 'income' ? 'badge-income' : 'badge-expense'}">
                ${t.type === 'income' ? '+' : '-'}${formatRupiah(t.amount)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Dihasilkan secara otomatis oleh Aplikasi Finance Tracking • Cetak Laporan Keuangan Realtime
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
