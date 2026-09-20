// Vercel Serverless Function & Cron Job Handler for Supabase Keep-Alive
// Dipanggil otomatis oleh Vercel Cron setiap 3 hari sekali (schedule: "0 0 */3 * *")

export default async function handler(req, res) {
  const start = Date.now();
  const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ynmrprqflgewraqbcigt.supabase.co';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubXJwcnFmbGdld3JhcWJjaWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDk3MDEsImV4cCI6MjEwMjkyNTcwMX0.fQhvf_OBsjXm58t4Eh_7kFgXy6VhQewwP8ZElrep6Ls';

  const baseUrl = rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/auth\/v1\/?$/, '')
    .replace(/\/+$/, '');

  try {
    // 1. Eksekusi query ringan ke REST API Supabase (categories)
    const targetUrl = `${baseUrl}/rest/v1/categories?select=id&limit=1`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      // Coba fallback ke root REST OpenAPI endpoint
      const rootRes = await fetch(`${baseUrl}/rest/v1/`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (rootRes.ok) {
        return res.status(200).json({
          success: true,
          trigger: 'vercel-cron',
          timestamp: new Date().toISOString(),
          latencyMs,
          message: 'Supabase REST API keep-alive ping successful (root endpoint)',
        });
      }

      return res.status(response.status).json({
        success: false,
        trigger: 'vercel-cron',
        timestamp: new Date().toISOString(),
        latencyMs,
        error: `Supabase returned status code ${response.status}`,
      });
    }

    return res.status(200).json({
      success: true,
      trigger: 'vercel-cron',
      timestamp: new Date().toISOString(),
      latencyMs,
      message: 'Supabase keep-alive ping successful via PostgreSQL query',
    });
  } catch (error) {
    const latencyMs = Date.now() - start;
    return res.status(500).json({
      success: false,
      trigger: 'vercel-cron',
      timestamp: new Date().toISOString(),
      latencyMs,
      error: error?.message || 'Network error during ping',
    });
  }
}
