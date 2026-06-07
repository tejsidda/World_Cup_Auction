import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/auth';

type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    isAdmin: row.is_admin,
  };
}

export function displayNameFromEmail(email: string): string {
  return email.split('@')[0] || 'Player';
}

/** Used when the DB is slow — session is valid but profile row isn't loaded yet. */
export function profileFromAuthUser(user: User): Profile {
  const email = user.email?.toLowerCase() ?? '';
  const displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    displayNameFromEmail(email);

  return {
    id: user.id,
    email,
    displayName,
    isAdmin: false,
  };
}
