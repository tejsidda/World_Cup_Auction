import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '../env';
import { authSupabaseFetch } from './fetch';

let authClient: SupabaseClient | null = null;

/** Browser client with auth session cookies — use for login/lobby only. */
export function getAuthSupabase(): SupabaseClient {
  if (authClient) return authClient;

  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('Supabase is not configured');
  }

  authClient = createBrowserClient(env.url, env.anonKey, {
    global: { fetch: authSupabaseFetch },
  });
  return authClient;
}

export function resetAuthSupabaseClient(): void {
  authClient = null;
}
