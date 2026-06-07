import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { cancelCurrentLot } from '@/lib/db/auction-repository';

export async function POST() {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    await cancelCurrentLot();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not cancel bidding';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
