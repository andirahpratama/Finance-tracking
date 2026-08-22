# 💰 Finance Tracking - Aplikasi Pencatatan Keuangan Pribadi

Aplikasi pencatatan keuangan pribadi modern, responsif, dan real-time yang dilengkapi dengan **karakter maskot animasi interaktif ("Finny")** yang merespons kondisi saldo dompet Anda, grafik analitik visual interaktif, sistem kategori dinamis, serta integrasi **Supabase (PostgreSQL, Auth & Realtime)** yang siap di-deploy ke **GitHub** dan **Vercel**.

---

## ✨ Fitur Utama

### 1. 🎭 Karakter Maskot Interaktif ("Finny")
Finny adalah asisten virtual keuangan yang berubah ekspresi dan animasi secara real-time berdasarkan total saldo Anda:
- 🟢 **Saldo > Rp 1.000.000**: **Senang / Bahagia** (mata berbinar, melompat riang, koin berputar, efek konfeti emas/hijau, dan pesan pujian finansial sehat).
- 🟡 **Rp 500.000 ≤ Saldo ≤ Rp 1.000.000**: **Datar / Tenang** (mata berkedip santai, animasi mengapung tenang, dan tips menjaga pengeluaran harian).
- 🔴 **Saldo < Rp 500.000**: **Sedih / Gelisah** (tetesan air mata/keringat animasi, gemetar waspada, dan motivasi berhemat ketat).
- 👆 **Interaksi Sentuh**: Klik karakter Finny untuk mendapatkan respons lucu dan tips keuangan acak!

### 2. 🏷️ Kategori Pemasukan & Pengeluaran Dinamis
- **Pemasukan Bawaan (Default)**:
  - 💼 Gaji Suami
  - 💼 Gaji Istri
  - 📈 Bisnis
  - 📊 Investasi
- **Pengeluaran Bawaan (Default)**:
  - 🍲 Belanja Makanan
  - 🛒 Belanja Kebutuhan Harian
  - 🚗 Transportasi
  - 👶 Jajan Anak
  - ☕ Jajan Orang Tua
  - 🎓 Sekolah Anak
- **Kustomisasi Penuh**: Tambah, ubah nama, pilih warna kustom, dan pilih ikon baru atau hapus kategori kapan saja.

### 3. 📊 Visualisasi Grafik & Analitik Real-Time
- **Area Chart Arus Kas**: Menampilkan tren pemasukan vs pengeluaran dari waktu ke waktu secara berdampingan.
- **Donut Chart Distribusi Kategori**: Menghitung persentase alokasi dana per kategori secara otomatis.
- **Kartu Ringkasan KPI**: Total Saldo, Total Pemasukan Bulan Ini, Total Pengeluaran Bulan Ini, dan Rasio Tabungan (Savings Rate %).

### 4. 🔒 Multi-User & Database SQL Supabase
- Registrasi dan Login mandiri untuk tiap pengguna.
- **Row Level Security (RLS)** pada PostgreSQL menjamin data setiap pengguna terisolasi 100% dan aman.
- **Supabase Realtime**: Perubahan data di satu browser akan langsung terupdate secara instan di browser/perangkat lain yang sedang membuka akun yang sama!
- **Demo Mode Otomatis**: Aplikasi dapat langsung digunakan secara offline/tamu tanpa konfigurasi Supabase awal.

### 5. 📄 Ekspor & Cetak Laporan
- Ekspor riwayat transaksi ke format **CSV**.
- Cetak / Simpan sebagai **PDF Laporan Keuangan** rapi dengan sekali klik.

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js versi 18 atau lebih tinggi
- Akun Supabase (opsional jika ingin menggunakan database cloud langsung)

### 2. Instalasi & Menjalankan Dev Server
```bash
# Masuk ke direktori project
cd "f:/12. Project AI/2. App Web Base"

# Install dependensi (jika belum)
npm install

# Jalankan server lokal
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🗄️ Konfigurasi Supabase (Database & Realtime)

1. Buat project baru di [Supabase](https://supabase.com).
2. Buka menu **SQL Editor** di Dashboard Supabase Anda -> klik **New Query**.
3. Buka file `supabase/schema.sql` pada project ini, copy seluruh kodenya, lalu paste ke SQL Editor Supabase dan klik **Run**.
4. Buka menu **Project Settings** -> **API**, lalu salin:
   - **Project URL**
   - **Project API Anon Key**
5. Buat file `.env` di direktori utama project (bisa copy dari `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. Restart server development (`npm run dev`). Sekarang aplikasi Anda telah terhubung penuh ke Supabase Realtime!

---

## 🌐 Panduan Deploy ke GitHub & Vercel

### Langkah 1: Push ke GitHub
```bash
git init
git add .
git commit -m "feat: initial commit Finance Tracking app with mascot and supabase"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/finance-tracking.git
git push -u origin main
```

### Langkah 2: Deploy ke Vercel
1. Buka [Vercel](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New...** -> **Project**.
3. Pilih repository `finance-tracking` yang baru saja di-push.
4. Pada bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = (URL Supabase Anda)
   - `VITE_SUPABASE_ANON_KEY` = (Anon Key Supabase Anda)
5. Klik tombol **Deploy**. Vercel akan mem-build aplikasi dan memberikan URL domain live (misal: `https://finance-tracking-app.vercel.app`) dalam hitungan detik!

---

## 📦 Struktur Direktori Proyek

```
finance-tracking/
├── public/
│   └── favicon.svg              # Favicon aplikasi
├── src/
│   ├── components/
│   │   ├── auth/                # Modal Login & Registrasi
│   │   ├── categories/          # Modal Manajemen Kategori
│   │   ├── dashboard/           # Komponen Grafik & Kartu Stat
│   │   ├── layout/              # Navbar & Footer
│   │   ├── mascot/              # Maskot Finny & Logika Animasi Ekspresi Saldo
│   │   ├── transactions/        # Form & Daftar Riwayat Transaksi
│   │   └── ui/                  # Icon renderer & UI helper
│   ├── context/
│   │   ├── AuthContext.tsx      # Manajemen state user & auth
│   │   └── FinanceContext.tsx   # Realtime state & CRUD data
│   ├── lib/
│   │   ├── defaultData.ts       # Kategori bawaan & data awal
│   │   ├── exportUtils.ts       # Ekspor CSV & Cetak Laporan
│   │   ├── formatters.ts        # Format Rupiah & tanggal Indonesia
│   │   └── supabase.ts          # Supabase client & fallback detector
│   ├── types/
│   │   └── index.ts             # Definisi TypeScript
│   ├── App.tsx                  # Dashboard Utama
│   ├── index.css                # Styling Tailwind & Glassmorphism
│   └── main.tsx
├── supabase/
│   └── schema.sql               # Script DDL SQL & Trigger Supabase
├── .env.example                 # Contoh variabel lingkungan
├── vercel.json                  # Konfigurasi rewrite SPA Vercel
└── package.json
```
