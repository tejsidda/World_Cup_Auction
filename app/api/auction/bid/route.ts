import { NextResponse } from 'next/server';
import { requireUser, isAuthedContext } from '@/lib/auth/require-user';
import { getUserTeamId } from '@/lib/db/session-repository';
import { submitBid } from '@/lib/db/auction-repository';

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const teamId = await getUserTeamId(ctx.supabase, ctx.userId);
    if (!teamId) {
      return NextResponse.json({ error: 'You are not on a team' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const pass = body.pass === true;
    const amount = pass ? null : Number(body.amount);

    await submitBid(teamId, amount);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not submit bid';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
