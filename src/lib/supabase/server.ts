import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '../env';

/** Server-side Supabase client (Route Handlers). Uses anon key + RLS. */
export function createServerSupabase() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('Supabase is not configured');
  }
  return createClient(env.url, env.anonKey);
}
