import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { startAuction } from '@/lib/db/auction-repository';

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const body = await request.json().catch(() => ({}));
    const teamCount = typeof body.teamCount === 'number' ? body.teamCount : 0;
    const state = await startAuction(teamCount);

    // Unified start: flip the multiplayer session live so players' watch
    // screens activate. Best-effort — the auction itself is already started.
    await ctx.supabase
      .from('auction_sessions')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', 1);

    return NextResponse.json(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start auction';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
