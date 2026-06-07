import { NextResponse } from 'next/server';
import { getPoolPlayersByCountry } from '@/lib/db/auction-repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country')?.trim().toUpperCase();
    if (!country) {
      return NextResponse.json({ error: 'country query param required' }, { status: 400 });
    }
    const players = await getPoolPlayersByCountry(country);
    return NextResponse.json({ players });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load players';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
