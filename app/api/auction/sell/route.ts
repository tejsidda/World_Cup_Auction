import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { sellOnBlockPlayer } from '@/lib/db/auction-repository';

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const body = await request.json();
    const teamId = typeof body.teamId === 'string' ? body.teamId : '';
    const priceM = Number(body.priceM);

    const sale = await sellOnBlockPlayer(teamId, priceM);
    return NextResponse.json({ sale });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sale failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
