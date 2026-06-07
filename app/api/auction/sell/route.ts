import { NextResponse } from 'next/server';
import { sellOnBlockPlayer } from '@/lib/db/auction-repository';

export async function POST(request: Request) {
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
