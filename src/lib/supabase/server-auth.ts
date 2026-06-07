import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '../env';
import { authSupabaseFetch } from './fetch';

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

/** Cookie-aware server client — use for authenticated route handlers. */
export async function createAuthServerClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('Supabase is not configured');
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    global: { fetch: authSupabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll from a Server Component — safe to ignore when read-only
        }
      },
    },
  });
}
