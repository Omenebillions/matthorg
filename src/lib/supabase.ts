import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanEnvVal(val?: string | null): string {
  if (!val) return '';
  let cleaned = String(val).trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/\/+$/, '');
}

const initialUrl = cleanEnvVal(
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
);
const initialKey = cleanEnvVal(
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || import.meta.env.VITE_SUPABASE_ANON_KEY
);

export let supabase: SupabaseClient | null = (initialUrl && initialKey)
  ? createClient(initialUrl, initialKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

type SupabaseInitListener = (client: SupabaseClient) => void;
const listeners: SupabaseInitListener[] = [];

export function onSupabaseInit(cb: SupabaseInitListener) {
  if (supabase) {
    cb(supabase);
  } else {
    listeners.push(cb);
  }
}

/**
 * Ensures Supabase client is initialized.
 * If not already set via client environment variables, fetches /api/config from server.
 */
export async function ensureSupabase(): Promise<SupabaseClient | null> {
  if (supabase) return supabase;

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      const url = cleanEnvVal(data.supabaseUrl);
      const key = cleanEnvVal(data.supabaseAnonKey);

      if (url && key) {
        supabase = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        listeners.forEach(cb => cb(supabase!));
        listeners.length = 0;
        return supabase;
      }
    }
  } catch (err) {
    console.warn('Could not load Supabase config from /api/config:', err);
  }

  return supabase;
}

// Kick off auto-initialization in the background
ensureSupabase();

