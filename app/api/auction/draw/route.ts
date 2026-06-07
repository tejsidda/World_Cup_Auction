import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { drawRandomPlayer, getAuctionState } from '@/lib/db/auction-repository';

export async function POST() {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const state = await getAuctionState();
    if (state.phase !== 'in_progress') {
      return NextResponse.json({ error: 'Auction has not started yet' }, { status: 400 });
    }
    const player = await drawRandomPlayer(state.drawSettings);
    return NextResponse.json({ player });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Draw failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
