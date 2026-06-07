import { NextResponse } from 'next/server';
import { getOnBlockPlayer } from '@/lib/db/auction-repository';

export async function GET() {
  try {
    const player = await getOnBlockPlayer();
    return NextResponse.json({ player });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load current lot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
