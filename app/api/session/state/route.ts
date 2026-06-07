import { NextResponse } from 'next/server';
import { requireUser, isAuthedContext } from '@/lib/auth/require-user';
import { getSessionState } from '@/lib/db/session-repository';

export async function GET() {
  const ctx = await requireUser();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const state = await getSessionState(ctx.supabase, ctx.userId);
    return NextResponse.json({ state });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
