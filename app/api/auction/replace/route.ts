import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { replacePlayer, searchUnassignedPoolPlayers } from '@/lib/db/auction-repository';

export async function GET(request: Request) {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const players = await searchUnassignedPoolPlayers(q);
    return NextResponse.json({ players });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const body = await request.json();
    const existingPlayerId = typeof body.existingPlayerId === 'string' ? body.existingPlayerId : '';
    const replacementFifaId = Number(body.replacementFifaId);
    const teamId = typeof body.teamId === 'string' ? body.teamId : '';

    if (!existingPlayerId || !teamId || !Number.isFinite(replacementFifaId)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const result = await replacePlayer(existingPlayerId, replacementFifaId, teamId);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Replace failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
