import { NextResponse } from 'next/server';
import { getAuctionState } from '@/lib/db/auction-repository';

export async function GET() {
  try {
    const state = await getAuctionState();
    return NextResponse.json(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load auction status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
