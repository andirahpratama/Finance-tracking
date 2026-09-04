import { Transaction } from '../types';
import { formatDateIndo, formatRupiah, formatCompactRupiah } from './formatters';

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

export interface PrintReportStats {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  monthName: string;
  periodType?: 'daily' | 'this_month' | 'specific_month' | 'yearly' | 'all';
  year?: number;
  monthIndex?: number;
  day?: number;
}

export const printFinancialReport = (
  transactions: Transaction[],
  stats: PrintReportStats
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk mencetak laporan.');
    return;
  }

  const periodType = stats.periodType || 'this_month';
  const year = stats.year ?? new Date().getFullYear();
  const monthIndex = stats.monthIndex ?? new Date().getMonth();
  const day = stats.day ?? new Date().getDate();

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

  // Generate SVG Cashflow Bar Chart
  const svgChartHTML = generateCashflowSVG(periodType, transactions, year, monthIndex, day);

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Laporan Keuangan - Finance Tracking</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; background: #ffffff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
        .title { color: #059669; font-size: 24px; font-weight: 800; margin: 0; }
        .sub { color: #64748b; font-size: 13px; margin-top: 4px; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .card { padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .card h4 { margin: 0 0 6px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .card p { margin: 0; font-size: 20px; font-weight: 800; }
        .income { color: #059669; }
        .expense { color: #e11d48; }
        .balance { color: #0284c7; }

        .section-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #059669; padding-left: 10px; }
        
        .chart-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; margin-bottom: 24px; }
        .chart-legend { display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-bottom: 12px; font-size: 12px; font-weight: 600; }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-color { width: 12px; height: 12px; border-radius: 3px; }

        .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
        .chart-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff; }
        .bar-item { margin-bottom: 12px; }
        .bar-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
        .bar-bg { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }

        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; }
        .badge-income { color: #059669; font-weight: 700; }
        .badge-expense { color: #e11d48; font-weight: 700; }
        
        .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 16px; }

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
          <h4>Total Saldo / Net</h4>
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

      <!-- Section 1: Visualisasi Grafik Arus Kas -->
      <div class="section-title">Grafik Visualisasi Arus Kas (${periodType === 'daily' ? 'Harian' : periodType === 'yearly' ? 'Tahunan' : 'Bulanan'})</div>
      <div class="chart-box">
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color" style="background:#10B981;"></div>
            <span>Pemasukan</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background:#F43F5E;"></div>
            <span>Pengeluaran</span>
          </div>
        </div>
        ${svgChartHTML}
      </div>

      <!-- Section 2: Breakdown Kategori -->
      <div class="section-title">Analisis Breakdown Kategori</div>
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

      <!-- Section 3: History Transaksi Table -->
      <div class="section-title">Detail Riwayat Transaksi Keuangan</div>
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
        Dihasilkan secara otomatis oleh Aplikasi Finance Tracking • Cetak Laporan Keuangan Realtime dengan Grafik Vector
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

const generateCashflowSVG = (
  periodType: string,
  transactions: Transaction[],
  year: number,
  monthIndex: number,
  _day: number
) => {
  const width = 760;
  const height = 180;
  const paddingLeft = 65;
  const paddingBottom = 30;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (periodType === 'yearly') {
    const monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyData = monthShorts.map((name, i) => {
      let inc = 0;
      let exp = 0;
      transactions.forEach((t) => {
        const parts = t.date.split('T')[0].split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (y === year && m === i) {
          if (t.type === 'income') inc += Number(t.amount);
          else exp += Number(t.amount);
        }
      });
      return { name, income: inc, expense: exp };
    });

    const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1000);
    const barGroupWidth = chartWidth / 12;
    const barWidth = Math.max(barGroupWidth * 0.35, 6);

    let barsHTML = '';
    monthlyData.forEach((d, i) => {
      const xCenter = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
      const incHeight = (d.income / maxVal) * chartHeight;
      const expHeight = (d.expense / maxVal) * chartHeight;

      const incY = paddingTop + chartHeight - incHeight;
      const expY = paddingTop + chartHeight - expHeight;

      barsHTML += `<rect x="${xCenter - barWidth - 1}" y="${incY}" width="${barWidth}" height="${incHeight}" fill="#10B981" rx="2"/>`;
      barsHTML += `<rect x="${xCenter + 1}" y="${expY}" width="${barWidth}" height="${expHeight}" fill="#F43F5E" rx="2"/>`;
      barsHTML += `<text x="${xCenter}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#64748B">${d.name}</text>`;
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#ffffff; border-radius:8px; border:1px solid #e2e8f0;">
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight / 2}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight / 2}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" stroke="#cbd5e1"/>
        
        <text x="${paddingLeft - 8}" y="${paddingTop + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompactRupiah(maxVal)}</text>
        <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight / 2 + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompactRupiah(maxVal / 2)}</text>
        <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight + 3}" text-anchor="end" font-size="9" fill="#94a3b8">0</text>

        ${barsHTML}
      </svg>
    `;
  } else if (periodType === 'daily') {
    const catMap: Record<string, { name: string; income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const name = t.category_name || 'Lainnya';
      if (!catMap[name]) catMap[name] = { name, income: 0, expense: 0 };
      if (t.type === 'income') catMap[name].income += Number(t.amount);
      else catMap[name].expense += Number(t.amount);
    });
    const catData = Object.values(catMap);
    if (!catData.length) {
      return `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:12px;">Tidak ada data transaksi harian ini</div>`;
    }

    const maxVal = Math.max(...catData.map((d) => Math.max(d.income, d.expense)), 1000);
    const barGroupWidth = chartWidth / catData.length;
    const barWidth = Math.min(Math.max(barGroupWidth * 0.35, 10), 30);

    let barsHTML = '';
    catData.forEach((d, i) => {
      const xCenter = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
      const incHeight = (d.income / maxVal) * chartHeight;
      const expHeight = (d.expense / maxVal) * chartHeight;

      const incY = paddingTop + chartHeight - incHeight;
      const expY = paddingTop + chartHeight - expHeight;

      barsHTML += `<rect x="${xCenter - barWidth - 1}" y="${incY}" width="${barWidth}" height="${incHeight}" fill="#10B981" rx="2"/>`;
      barsHTML += `<rect x="${xCenter + 1}" y="${expY}" width="${barWidth}" height="${expHeight}" fill="#F43F5E" rx="2"/>`;
      const truncateLabel = d.name.length > 8 ? d.name.substring(0, 7) + '..' : d.name;
      barsHTML += `<text x="${xCenter}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#64748B">${truncateLabel}</text>`;
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#ffffff; border-radius:8px; border:1px solid #e2e8f0;">
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight / 2}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight / 2}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" stroke="#cbd5e1"/>
        
        <text x="${paddingLeft - 8}" y="${paddingTop + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompactRupiah(maxVal)}</text>
        <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight / 2 + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompactRupiah(maxVal / 2)}</text>
        <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight + 3}" text-anchor="end" font-size="9" fill="#94a3b8">0</text>

        ${barsHTML}
      </svg>
    `;
  } else {
    // Monthly view
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dailyData: { day: number; income: number; expense: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dailyData.push({ day: d, income: 0, expense: 0 });
    }

    transactions.forEach((t) => {
      const parts = t.date.split('T')[0].split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (y === year && m === monthIndex && dailyData[d - 1]) {
        if (t.type === 'income') dailyData[d - 1].income += Number(t.amount);
        else dailyData[d - 1].expense += Number(t.amount);
      }
    });

    const maxVal = Math.max(...dailyData.map((d) => Math.max(d.income, d.expense)), 1000);
    const barGroupWidth = chartWidth / daysInMonth;
    const barWidth = Math.max(barGroupWidth * 0.4, 3);

    let barsHTML = '';
    dailyData.forEach((d, i) => {
      const xCenter = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
      const incHeight = (d.income / maxVal) * chartHeight;
      const expHeight = (d.expense / maxVal) * chartHeight;

      const incY = paddingTop + chartHeight - incHeight;
      const expY = paddingTop + chartHeight - expHeight;

      barsHTML += `<rect x="${xCenter - barWidth - 0.5}" y="${incY}" width="${barWidth}" height="${incHeight}" fill="#10B981" rx="1"/>`;
      barsHTML += `<rect x="${xCenter + 0.5}" y="${expY}" width="${barWidth}" height="${expHeight}" fill="#F43F5E" rx="1"/>`;
      if (d.day === 1 || d.day % 5 === 0 || d.day === daysInMonth) {
        barsHTML += `<text x="${xCenter}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#64748B">${d.day}</text>`;
      }
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#ffffff; border-radius:8px; border:1px solid #e2e8f0;">
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight / 2}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight / 2}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" stroke="#cbd5e1"/>
        
        <text x="${paddingLeft - 8}" y="${paddingTop + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompactRupiah(maxVal)}</text>
        <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight / 2 + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompactRupiah(maxVal / 2)}</text>
        <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight + 3}" text-anchor="end" font-size="9" fill="#94a3b8">0</text>

        ${barsHTML}
      </svg>
    `;
  }
};
