// Vercel Cron runs this DB query even when nobody opens the app.
export default async function handler(req, res) {
  const start = Date.now();
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim().replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const result = (status, body) => res.status(status).json({
    success: status === 200,
    trigger: req.headers['user-agent']?.startsWith('vercel-cron/') ? 'vercel-cron' : 'manual',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    ...body,
  });
  if (!baseUrl || !anonKey) {
    return result(503, { error: 'Supabase environment variables are missing' });
  }
  // Retry transient failures once. Each request is bounded to 8 seconds.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/rest/v1/categories?select=id&limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (!response.ok) {
        if ((response.status >= 500 || response.status === 429) && attempt < 2) continue;
        return result(502, { error: 'Supabase database query failed', upstreamStatus: response.status, attempts: attempt });
      }
      const rows = await response.json();
      if (!Array.isArray(rows)) {
        return result(502, { error: 'Unexpected Supabase query response', attempts: attempt });
      }
      return result(200, { message: 'Supabase keep-alive database query successful', attempts: attempt });
    } catch {
      if (attempt === 2) return result(502, { error: 'Supabase query timed out or could not be completed', attempts: attempt });
    }
  }
}
