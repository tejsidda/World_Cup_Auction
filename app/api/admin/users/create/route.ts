import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { adminCreateUser, type TeamAssignment } from '@/lib/db/admin-users-repository';

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const body = await request.json().catch(() => ({}));

    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName : '';

    const rawTeam = body.team ?? { mode: 'none' };
    let team: TeamAssignment;
    if (rawTeam.mode === 'new') {
      team = {
        mode: 'new',
        teamName: typeof rawTeam.teamName === 'string' ? rawTeam.teamName : '',
        budgetTotal:
          rawTeam.budgetTotal !== undefined ? Number(rawTeam.budgetTotal) : undefined,
      };
    } else if (rawTeam.mode === 'existing') {
      team = {
        mode: 'existing',
        teamId: typeof rawTeam.teamId === 'string' ? rawTeam.teamId : '',
      };
    } else {
      team = { mode: 'none' };
    }

    const result = await adminCreateUser({ email, password, displayName, team });
    return NextResponse.json({ user: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create the account';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
