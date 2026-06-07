import { NextResponse } from 'next/server';
import { getPoolStats } from '@/lib/db/pool-repository';

export async function GET() {
  try {
    const stats = await getPoolStats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load pool stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
