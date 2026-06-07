import { NextResponse } from 'next/server';
import { searchPoolPlayers } from '@/lib/db/auction-repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const players = await searchPoolPlayers(q);
    return NextResponse.json({ players });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
