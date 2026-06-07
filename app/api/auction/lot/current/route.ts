import { NextResponse } from 'next/server';
import { requireUser, isAuthedContext } from '@/lib/auth/require-user';
import { getUserTeamId } from '@/lib/db/session-repository';
import { getCurrentLotState } from '@/lib/db/auction-repository';

export async function GET() {
  const ctx = await requireUser();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const teamId = await getUserTeamId(ctx.supabase, ctx.userId);
    const state = await getCurrentLotState(teamId);
    return NextResponse.json({ state, teamId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load lot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
