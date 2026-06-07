import { NextResponse } from 'next/server';
import { resetAuction } from '@/lib/db/auction-repository';

export async function POST() {
  try {
    const result = await resetAuction();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
