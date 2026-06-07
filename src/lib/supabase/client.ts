import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '../env';
import { supabaseFetch } from './fetch';

let client: SupabaseClient | null = null;

/** Lightweight client for league/team reads — no auth cookie overhead. */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('Supabase is not configured');
  }

  client = createClient(env.url, env.anonKey, {
    global: { fetch: supabaseFetch },
  });
  return client;
}

export function resetSupabaseClient(): void {
  client = null;
}
