import { NextResponse } from 'next/server';
import { requireUser, isAuthedContext } from '@/lib/auth/require-user';
import { resetSession } from '@/lib/db/session-repository';

export async function POST() {
  const ctx = await requireUser();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    await resetSession(ctx.supabase, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not reset session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
