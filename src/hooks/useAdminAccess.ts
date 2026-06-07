'use client';

import { useEffect, useState } from 'react';
import { readCachedProfile } from '@/lib/auth/profile-cache';
import { isSupabaseConfigured } from '@/lib/env';
import { getAuthSupabase } from '@/lib/supabase/auth-client';

/** Dashboard only — checks admin flag without full AuthProvider. */
export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await getAuthSupabase().auth.getSession();

      if (!session?.user) {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      // Cache is instant — use it immediately
      const cached = readCachedProfile(session.user.id);
      if (cached) {
        if (!cancelled) {
          setIsAdmin(cached.isAdmin);
          setLoading(false);
        }
        return;
      }

      // No cache — try a quick fetch but don't block forever
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch('/api/auth/me', { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.profile) {
            setIsAdmin(data.profile.isAdmin === true);
          }
        }
      } catch {
        // Timed out — no admin badge on dashboard, not a big deal
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, loading };
}
