import { NextResponse } from 'next/server';
import { callUpPlayer } from '@/lib/db/auction-repository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fifaId = Number(body.fifaId);
    if (!Number.isFinite(fifaId)) {
      return NextResponse.json({ error: 'Invalid fifaId' }, { status: 400 });
    }
    const player = await callUpPlayer(fifaId);
    return NextResponse.json({ player });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Call-up failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
