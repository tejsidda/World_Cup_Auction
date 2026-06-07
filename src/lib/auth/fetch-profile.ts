import type { Profile } from '@/types/auth';

export type ProfileFetchResult = {
  profile: Profile | null;
  partial: boolean;
};

let inFlight: Promise<ProfileFetchResult> | null = null;

export async function fetchProfileFromApi(
  signal?: AbortSignal
): Promise<ProfileFetchResult> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const res = await fetch('/api/auth/me', {
      cache: 'no-store',
      signal,
    });

    if (res.status === 401) {
      return { profile: null, partial: false };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error ?? 'Could not load profile');
    }

    return {
      profile: data.profile ?? null,
      partial: data.partial === true,
    };
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
