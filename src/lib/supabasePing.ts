import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from './supabase';
import { SupabasePingLog, SupabasePingStatus, PingTriggerType } from '../types';

const LAST_PING_KEY = 'ft_supabase_last_ping';
const PING_HISTORY_KEY = 'ft_supabase_ping_history';

// 3 days in milliseconds (3 * 24 * 60 * 60 * 1000)
export const AUTO_PING_INTERVAL_DAYS = 3;
export const AUTO_PING_INTERVAL_MS = AUTO_PING_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

export const PING_UPDATED_EVENT = 'ft-supabase-ping-updated';

/**
 * Mendapatkan timestamp ping terakhir (dalam ms sejak epoch)
 */
export const getLastPingTime = (): number | null => {
  try {
    const raw = localStorage.getItem(LAST_PING_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  } catch (e) {
    console.error('Gagal membaca last ping timestamp:', e);
    return null;
  }
};

/**
 * Mendapatkan estimasi waktu jadwal ping otomatis berikutnya
 */
export const getNextPingTime = (): number | null => {
  const last = getLastPingTime();
  if (!last) return null;
  return last + AUTO_PING_INTERVAL_MS;
};

/**
 * Mengambil riwayat log ping tersimpan dari localStorage
 */
export const getPingHistory = (): SupabasePingLog[] => {
  try {
    const raw = localStorage.getItem(PING_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Gagal memuat riwayat ping:', e);
    return [];
  }
};

/**
 * Menghapus riwayat ping
 */
export const clearPingHistory = (): void => {
  try {
    localStorage.removeItem(PING_HISTORY_KEY);
    window.dispatchEvent(new CustomEvent(PING_UPDATED_EVENT));
  } catch (e) {
    console.error('Gagal menghapus riwayat ping:', e);
  }
};

/**
 * Menyimpan entri ping baru ke riwayat
 */
const savePingLog = (log: SupabasePingLog): void => {
  try {
    localStorage.setItem(LAST_PING_KEY, Date.now().toString());
    const current = getPingHistory();
    const updated = [log, ...current].slice(0, 25); // Simpan maks 25 entri terakhir
    localStorage.setItem(PING_HISTORY_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(PING_UPDATED_EVENT, { detail: log }));
  } catch (e) {
    console.error('Gagal menyimpan log ping:', e);
  }
};

/**
 * Menjalankan Ping ke Supabase untuk menjaga project tetap aktif (Keep-Alive)
 */
export const pingSupabase = async (
  trigger: PingTriggerType = 'manual'
): Promise<SupabasePingLog> => {
  const start = performance.now();
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured() || !supabase) {
    const errorLog: SupabasePingLog = {
      id: 'ping-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp,
      trigger,
      status: 'error',
      latencyMs: Math.round(performance.now() - start),
      message: 'Supabase belum dikonfigurasi (URL / Anon Key kosong atau default).',
      statusCode: 400,
    };
    savePingLog(errorLog);
    return errorLog;
  }

  try {
    // 1. Eksekusi query ringan ke database via client Supabase
    // Query ini akan mendaftarkan aktivitas transaksi SQL di instance Postgres Supabase
    const { error: queryError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - start);

    if (queryError && !queryError.message.includes('0 rows')) {
      // Jika ada error pada query tabel, coba fallback ke REST OpenAPI root endpoint
      try {
        const restResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        });

        if (restResponse.ok || restResponse.status === 200) {
          const successLog: SupabasePingLog = {
            id: 'ping-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            timestamp,
            trigger,
            status: 'success',
            latencyMs,
            message: 'Koneksi aktif via Supabase REST API endpoint.',
            statusCode: restResponse.status,
          };
          savePingLog(successLog);
          return successLog;
        }
      } catch (fallbackErr: any) {
        // Abaikan dan gunakan error pertama
      }

      const failLog: SupabasePingLog = {
        id: 'ping-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp,
        trigger,
        status: 'error',
        latencyMs,
        message: queryError.message || 'Kueri Supabase mengembalikan galat.',
        statusCode: 500,
      };
      savePingLog(failLog);
      return failLog;
    }

    // Ping sukses
    const successLog: SupabasePingLog = {
      id: 'ping-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp,
      trigger,
      status: 'success',
      latencyMs: Math.max(latencyMs, 1),
      message: 'Ping berhasil! Query database Postgres dan API PostgREST aktif.',
      statusCode: 200,
    };
    savePingLog(successLog);
    return successLog;
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    const errorLog: SupabasePingLog = {
      id: 'ping-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp,
      trigger,
      status: 'error',
      latencyMs,
      message: err?.message || 'Gagal menghubungi server Supabase (Network Error).',
      statusCode: 0,
    };
    savePingLog(errorLog);
    return errorLog;
  }
};

/**
 * Mengecek apakah sudah waktunya (3 hari sekali) untuk melakukan ping otomatis
 * Jika ya, jalankan ping secara silent di background
 */
export const checkAndTriggerAutoPing = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const last = getLastPingTime();
  const now = Date.now();

  // Jika belum pernah ping atau selisih >= 3 hari (259.200.000 ms)
  if (!last || now - last >= AUTO_PING_INTERVAL_MS) {
    try {
      await pingSupabase('auto');
      return true;
    } catch (e) {
      console.warn('Auto ping notice:', e);
    }
  }

  return false;
};

/**
 * Mengambil ringkasan status ping untuk ditampilkan di UI
 */
export const getSupabasePingStatus = (): SupabasePingStatus => {
  const isConfigured = isSupabaseConfigured();
  const lastTime = getLastPingTime();
  const nextTime = getNextPingTime();
  const history = getPingHistory();
  const latestLog = history.length > 0 ? history[0] : null;

  return {
    isConfigured,
    projectUrl: supabaseUrl,
    lastPingAt: lastTime ? new Date(lastTime).toISOString() : null,
    lastLatencyMs: latestLog ? latestLog.latencyMs : null,
    nextScheduledPingAt: nextTime ? new Date(nextTime).toISOString() : null,
    lastStatus: latestLog ? latestLog.status : 'idle',
    autoPingIntervalDays: AUTO_PING_INTERVAL_DAYS,
  };
};

/**
 * Helper format selisih waktu bahasa Indonesia yang ramah
 */
export const formatTimeAgo = (isoOrMs: string | number | null): string => {
  if (!isoOrMs) return 'Belum pernah';
  const time = typeof isoOrMs === 'string' ? new Date(isoOrMs).getTime() : isoOrMs;
  const now = Date.now();
  const diffMs = now - time;

  if (diffMs < 0) return 'Dalam antrean';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Kemarin';
  return `${days} hari lalu`;
};

/**
 * Helper format hitung mundur jadwal berikutnya
 */
export const formatCountdown = (nextIsoOrMs: string | number | null): string => {
  if (!nextIsoOrMs) return 'Segera setelah inisialisasi';
  const target = typeof nextIsoOrMs === 'string' ? new Date(nextIsoOrMs).getTime() : nextIsoOrMs;
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) return 'Jadwal sekarang (akan segera diping)';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return `${days} hari ${remainingHours} jam lagi`;
  }
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes > 60) {
    return `${hours} jam ${minutes % 60} menit lagi`;
  }
  return `${minutes} menit lagi`;
};
