// Vercel Serverless Function: AI Agent & Webhook REST API
// Allows external AI assistants (Claude, Cursor, ChatGPT, custom agents, Siri, n8n)
// to inspect financial summary and record transactions automatically.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ynmrprqflgewraqbcigt.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubXJwcnFmbGdld3JhcWJjaWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDk3MDEsImV4cCI6MjEwMjkyNTcwMX0.fQhvf_OBsjXm58t4Eh_7kFgXy6VhQewwP8ZElrep6Ls';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// In-memory pending buffer for real-time webapp synchronization
// Maps userId -> array of transactions queued by AI agents
const globalAgentQueue = globalThis.__agentPendingQueue || new Map();
globalThis.__agentPendingQueue = globalAgentQueue;

function parseApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('ft_agent_')) return null;
  try {
    const raw = apiKey.replace('ft_agent_', '');
    const jsonStr = Buffer.from(raw, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);
    return data.u || 'demo-user';
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Extract API Key
  const authHeader = req.headers.authorization || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const apiKey = tokenFromHeader || req.headers['x-api-key'] || req.query.apiKey || req.body?.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key diperlukan. Gunakan header Authorization: Bearer <apiKey> atau parameter ?apiKey=<apiKey>. Dapatkan API Key Anda di Pengaturan Profil -> AI Agent & MCP.',
    });
  }

  const userId = parseApiKey(apiKey);
  if (!userId) {
    return res.status(403).json({
      success: false,
      error: 'API Key tidak valid atau format salah.',
    });
  }

  // Initialize Supabase Client (Prefer Service Role for serverless backend access if configured)
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
    }
  );

  const action = req.query.action || req.body?.action || (req.method === 'GET' ? 'get_summary' : 'add_transaction');

  // ================= ACTION: PENDING QUEUE (For Web App Auto-Sync) =================
  if (action === 'pending' || action === 'poll_sync') {
    const queue = globalAgentQueue.get(userId) || [];
    if (req.method === 'POST') {
      // Clear queue after webapp acknowledged
      globalAgentQueue.set(userId, []);
      return res.status(200).json({ success: true, cleared: queue.length });
    }
    return res.status(200).json({ success: true, count: queue.length, items: queue });
  }

  // ================= ACTION: GET CATEGORIES =================
  if (action === 'get_categories') {
    try {
      const { data: dbCats } = await supabase
        .from('categories')
        .select('id, name, type, icon, color')
        .eq('user_id', userId)
        .order('name');

      const standardCategories = [
        { name: 'Gaji & Pendapatan', type: 'income' },
        { name: 'Bisnis & Penjualan', type: 'income' },
        { name: 'Investasi & Emas', type: 'income' },
        { name: 'Belanja Makanan & Dapur', type: 'expense' },
        { name: 'Belanja Kebutuhan Harian', type: 'expense' },
        { name: 'Transportasi & Bensin', type: 'expense' },
        { name: 'Tagihan & Utilitas', type: 'expense' },
        { name: 'Hiburan & Liburan', type: 'expense' },
        { name: 'Kesehatan & Obat', type: 'expense' },
        { name: 'Lainnya', type: 'expense' },
      ];

      return res.status(200).json({
        success: true,
        categories: dbCats && dbCats.length > 0 ? dbCats : standardCategories,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ================= ACTION: GET SUMMARY =================
  if (action === 'get_summary') {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let txList = [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100);

      if (!error && data) {
        txList = data;
      }

      let totalBalance = 0;
      let monthIncome = 0;
      let monthExpense = 0;

      txList.forEach((t) => {
        const amt = Number(t.amount) || 0;
        const d = new Date(t.date);
        const isThisMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;

        if (t.type === 'income') {
          totalBalance += amt;
          if (isThisMonth) monthIncome += amt;
        } else if (t.type === 'expense') {
          totalBalance -= amt;
          if (isThisMonth) monthExpense += amt;
        }
      });

      const savingsRate = monthIncome > 0 ? Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 100)) : 0;

      return res.status(200).json({
        success: true,
        summary: {
          user_id: userId,
          total_balance: totalBalance,
          this_month_income: monthIncome,
          this_month_expense: monthExpense,
          this_month_savings: monthIncome - monthExpense,
          savings_rate_percent: savingsRate,
          recent_transactions_count: txList.length,
          recent_transactions: txList.slice(0, 5).map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            category: t.category_name || t.notes || 'Transaksi',
            date: t.date,
            notes: t.notes,
          })),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ================= ACTION: ADD TRANSACTION (POST) =================
  if (action === 'add_transaction' || req.method === 'POST') {
    try {
      const body = req.body || {};
      const type = (body.type || 'expense').toLowerCase();
      const amount = Number(body.amount);
      const categoryName = body.category || body.category_name || (type === 'income' ? 'Investasi' : 'Lainnya');
      const notes = body.notes || body.description || `Dicatat oleh AI Agent (${categoryName})`;
      const date = body.date || new Date().toISOString().split('T')[0];

      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Nominal amount harus berupa angka positif lebih dari 0',
        });
      }

      if (type !== 'expense' && type !== 'income') {
        return res.status(400).json({
          success: false,
          error: "Tipe transaksi harus 'expense' atau 'income'",
        });
      }

      const txRecord = {
        id: `tx-agent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        type,
        amount: Math.round(amount),
        category_name: categoryName,
        date,
        notes,
        created_at: new Date().toISOString(),
      };

      // 1. Try persisting directly to Supabase
      let savedToDb = false;
      try {
        const { error: insertErr } = await supabase.from('transactions').insert([
          {
            user_id: userId,
            type,
            amount: Math.round(amount),
            date,
            notes: `${notes} [via AI Agent]`,
          },
        ]);
        if (!insertErr) {
          savedToDb = true;
        }
      } catch (e) {
        console.warn('Direct Supabase insert note:', e.message);
      }

      // 2. Add to active sync queue for webapp auto-import
      const currentQueue = globalAgentQueue.get(userId) || [];
      currentQueue.push(txRecord);
      globalAgentQueue.set(userId, currentQueue);

      return res.status(200).json({
        success: true,
        message: `Transaksi ${type === 'expense' ? 'pengeluaran' : 'pemasukan'} sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat oleh AI Agent!`,
        transaction: txRecord,
        saved_to_database: savedToDb,
        queued_for_sync: true,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({
    success: false,
    error: `Action '${action}' tidak dikenali. Pilihan: get_summary, get_categories, add_transaction, pending.`,
  });
}
