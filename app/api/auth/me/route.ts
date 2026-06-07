import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createAuthServerClient } from '@/lib/supabase/server-auth';
import { displayNameFromEmail, mapProfileRow } from '@/lib/auth/profile';

function buildFallbackProfile(user: User) {
  const email = user.email?.toLowerCase() ?? '';
  const displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    displayNameFromEmail(email);

  return { id: user.id, email, displayName, isAdmin: false };
}

export async function GET() {
  try {
    const supabase = await createAuthServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Try to load full profile from DB
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        // DB query failed (timeout, network, etc.) — return fallback
        return NextResponse.json({ profile: buildFallbackProfile(user), partial: true });
      }

      if (!profile) {
        // Profile row doesn't exist yet — try to create it
        const email = user.email?.toLowerCase() ?? '';
        const displayName =
          (user.user_metadata?.display_name as string | undefined)?.trim() ||
          displayNameFromEmail(email);

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email,
            display_name: displayName,
            is_admin: false,
          })
          .select('id, email, display_name, is_admin')
          .single();

        if (insertError) {
          return NextResponse.json({ profile: buildFallbackProfile(user), partial: true });
        }

        return NextResponse.json({ profile: mapProfileRow(inserted), partial: false });
      }

      return NextResponse.json({ profile: mapProfileRow(profile), partial: false });
    } catch {
      // Any error during DB operations — return fallback from session
      return NextResponse.json({ profile: buildFallbackProfile(user), partial: true });
    }
  } catch {
    // Can't even read session — truly not authenticated
    return NextResponse.json({ error: 'Auth check failed' }, { status: 401 });
  }
}
