import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '../env';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('Supabase is not configured');
  }

  client = createClient(env.url, env.anonKey);
  return client;
}

export function resetSupabaseClient(): void {
  client = null;
}
