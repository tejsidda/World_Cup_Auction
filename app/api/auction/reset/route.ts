import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { resetAuction } from '@/lib/db/auction-repository';

export async function POST() {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const result = await resetAuction();

    // Unified reset: return the multiplayer session to the lobby state.
    await ctx.supabase
      .from('auction_sessions')
      .update({ status: 'lobby', started_at: null, ended_at: null })
      .eq('id', 1);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
