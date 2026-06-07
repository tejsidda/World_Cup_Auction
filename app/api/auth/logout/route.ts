import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/server-auth';

export async function POST() {
  try {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign out failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
