'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getAuthSupabase } from '@/lib/supabase/auth-client';
import { isSupabaseConfigured } from '@/lib/env';
import { readCachedProfile, writeCachedProfile, clearCachedProfile } from '@/lib/auth/profile-cache';
import type { Profile } from '@/types/auth';

type AuthContextValue = {
  loading: boolean;
  configured: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  isAdmin: boolean;
  adminLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function profileFromSession(userId: string, email: string, displayName: string): Profile {
  return { id: userId, email, displayName, isAdmin: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const configured = isSupabaseConfigured();
  const adminFetchAttempted = useRef(false);

  // Load session from cookies — instant, no network
  const loadSession = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      setAdminLoading(false);
      return;
    }

    const supabase = getAuthSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) {
      setUserId(null);
      setEmail(null);
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      setAdminLoading(false);
      clearCachedProfile();
      return;
    }

    const userEmail = user.email?.toLowerCase() ?? '';
    const displayName =
      (user.user_metadata?.display_name as string | undefined)?.trim() ||
      userEmail.split('@')[0] ||
      'Player';

    setUserId(user.id);
    setEmail(userEmail);

    // Check cache for admin status
    const cached = readCachedProfile(user.id);
    if (cached) {
      setProfile(cached);
      setIsAdmin(cached.isAdmin);
      setAdminLoading(false);
    } else {
      setProfile(profileFromSession(user.id, userEmail, displayName));
      setIsAdmin(false);
    }

    setLoading(false);

    // Fire-and-forget: load admin status from DB (non-blocking)
    if (!adminFetchAttempted.current) {
      adminFetchAttempted.current = true;
      loadAdminStatus(user.id, userEmail, displayName);
    }
  }, [configured]);

  // Background fetch of admin status — never blocks the UI
  const loadAdminStatus = useCallback(
    async (uid: string, userEmail: string, displayName: string) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15_000);

        const res = await fetch('/api/auth/me', {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timer);

        if (!res.ok) {
          setAdminLoading(false);
          return;
        }

        const data = await res.json();
        if (data.profile) {
          const fullProfile: Profile = {
            id: data.profile.id ?? uid,
            email: data.profile.email ?? userEmail,
            displayName: data.profile.displayName ?? displayName,
            isAdmin: data.profile.isAdmin === true,
          };
          setProfile(fullProfile);
          setIsAdmin(fullProfile.isAdmin);
          writeCachedProfile(uid, fullProfile);
        }
      } catch {
        // Network failed — user still sees lobby, just without admin badge
      } finally {
        setAdminLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = getAuthSupabase();
    await supabase.auth.signOut().catch(() => {});
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearCachedProfile();
    setUserId(null);
    setEmail(null);
    setProfile(null);
    setIsAdmin(false);
    adminFetchAttempted.current = false;
    // Land somewhere usable rather than a "not signed in" dead-end
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const value = useMemo(
    () => ({
      loading,
      configured,
      userId,
      email,
      profile,
      isAdmin,
      adminLoading,
      signOut,
    }),
    [loading, configured, userId, email, profile, isAdmin, adminLoading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
