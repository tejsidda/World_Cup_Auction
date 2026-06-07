import { NextResponse } from 'next/server';
import { getRecentSales } from '@/lib/db/auction-repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? 10), 25);
    const sales = await getRecentSales(limit);
    return NextResponse.json({ sales });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load sales';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
