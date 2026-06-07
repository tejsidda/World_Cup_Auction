import { NextResponse } from 'next/server';
import { requireUser, isAuthedContext } from '@/lib/auth/require-user';
import { renameTeam } from '@/lib/db/session-repository';

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name : '';
    await renameTeam(ctx.supabase, ctx.userId, name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not rename team';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
