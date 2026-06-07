import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { callUpPlayer } from '@/lib/db/auction-repository';

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

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
