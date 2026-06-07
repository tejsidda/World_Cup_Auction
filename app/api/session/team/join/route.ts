import { NextResponse } from 'next/server';
import { requireUser, isAuthedContext } from '@/lib/auth/require-user';
import { joinTeam } from '@/lib/db/session-repository';

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const body = await request.json().catch(() => ({}));
    const teamId = typeof body.teamId === 'string' ? body.teamId : '';
    if (!teamId) throw new Error('Missing team');
    await joinTeam(ctx.supabase, ctx.userId, teamId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not join team';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
