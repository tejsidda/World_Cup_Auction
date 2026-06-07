import { NextResponse } from 'next/server';
import { drawRandomPlayer, getAuctionState } from '@/lib/db/auction-repository';

export async function POST() {
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
