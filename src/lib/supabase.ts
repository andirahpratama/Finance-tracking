import { createClient } from '@supabase/supabase-js';

// Sanitize URL to ensure base domain format even if user copies REST URL with /rest/v1
const cleanSupabaseUrl = (url: string): string => {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/auth\/v1\/?$/, '')
    .replace(/\/+$/, '');
};

const DEFAULT_SUPABASE_URL = 'https://ynmrprqflgewraqbcigt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubXJwcnFmbGdld3JhcWJjaWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDk3MDEsImV4cCI6MjEwMjkyNTcwMX0.fQhvf_OBsjXm58t4Eh_7kFgXy6VhQewwP8ZElrep6Ls';

export const supabaseUrl = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim() !== '' &&
    !supabaseUrl.includes('your-project-id') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Create client if configured, otherwise fallback to null
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
