import type { Profile } from '@/types/auth';

const CACHE_KEY = 'wc26_profile_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedProfile = {
  userId: string;
  profile: Profile;
  cachedAt: number;
};

export function readCachedProfile(userId: string): Profile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProfile;
    if (parsed.userId !== userId) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed.profile;
  } catch {
    return null;
  }
}

export function writeCachedProfile(userId: string, profile: Profile): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedProfile = { userId, profile, cachedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCachedProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
