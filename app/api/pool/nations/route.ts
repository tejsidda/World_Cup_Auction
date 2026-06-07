import { NextResponse } from 'next/server';
import { getPoolNations } from '@/lib/db/auction-repository';

export async function GET() {
  try {
    const nations = await getPoolNations();
    return NextResponse.json(nations);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load nations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
