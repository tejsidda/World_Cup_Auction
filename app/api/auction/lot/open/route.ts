import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { openLot } from '@/lib/db/auction-repository';

export async function POST() {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const result = await openLot();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open bidding';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
