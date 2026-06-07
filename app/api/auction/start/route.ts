import { NextResponse } from 'next/server';
import { startAuction } from '@/lib/db/auction-repository';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const teamCount = typeof body.teamCount === 'number' ? body.teamCount : 0;
    const state = await startAuction(teamCount);
    return NextResponse.json(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start auction';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
