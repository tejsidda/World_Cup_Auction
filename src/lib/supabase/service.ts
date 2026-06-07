import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '../env';
import { createServerSupabase } from './server';
import { supabaseFetch } from './fetch';

let serviceClient: SupabaseClient | null = null;

/** True when a service-role key is configured (enables real bid blindness). */
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Server-only client that bypasses RLS when SUPABASE_SERVICE_ROLE_KEY is set.
 * Used for bid reads/writes so other teams' amounts are never exposed via the
 * public anon key. Falls back gracefully to the anon client when the key is
 * absent, so the app keeps working before the key is configured.
 */
export function createServiceSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const env = getSupabaseEnv();

  if (!key || !env) {
    return createServerSupabase();
  }

  if (serviceClient) return serviceClient;
  serviceClient = createClient(env.url, key, {
    global: { fetch: supabaseFetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
