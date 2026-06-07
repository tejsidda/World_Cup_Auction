import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthServerClient } from '@/lib/supabase/server-auth';

export type AuthedContext = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * Resolves the signed-in user for a route handler.
 * Returns a NextResponse (401) when not authenticated, otherwise the context.
 */
export async function requireUser(): Promise<AuthedContext | NextResponse> {
  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return { supabase, userId: session.user.id };
}

export function isAuthedContext(value: AuthedContext | NextResponse): value is AuthedContext {
  return !(value instanceof NextResponse);
}

/**
 * Like requireUser, but also enforces the caller is an auction admin.
 * Returns 401 if not signed in, 403 if signed in but not an admin.
 */
export async function requireAdmin(): Promise<AuthedContext | NextResponse> {
  const ctx = await requireUser();
  if (!isAuthedContext(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', ctx.userId)
    .maybeSingle();

  if (error || data?.is_admin !== true) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  return ctx;
}
