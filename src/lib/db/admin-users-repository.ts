import { DEFAULT_BUDGET_M } from '@/config/constants';
import { createServiceSupabase, hasServiceRole } from '@/lib/supabase/service';

const TEAM_CAPACITY = 2;

export type TeamAssignment =
  | { mode: 'none' }
  | { mode: 'new'; teamName: string; budgetTotal?: number }
  | { mode: 'existing'; teamId: string };

export type CreateUserInput = {
  email: string;
  password: string;
  displayName?: string;
  team: TeamAssignment;
};

export type CreateUserResult = {
  userId: string;
  email: string;
  displayName: string;
  teamId: string | null;
  teamName: string | null;
};

async function nextSortOrder(supabase: ReturnType<typeof createServiceSupabase>): Promise<number> {
  const { data } = await supabase
    .from('teams')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

/**
 * Admin-only: create a confirmed auth account (no confirmation email sent) and
 * optionally attach it to a new or existing team. The signup DB trigger creates
 * the matching profile row automatically.
 */
export async function adminCreateUser(input: CreateUserInput): Promise<CreateUserResult> {
  if (!hasServiceRole()) {
    throw new Error(
      'Server is missing SUPABASE_SERVICE_ROLE_KEY — add it to your environment to create accounts.'
    );
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const displayName = (input.displayName ?? '').trim() || email.split('@')[0] || 'Player';

  if (!email || !email.includes('@')) throw new Error('Enter a valid email');
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const supabase = createServiceSupabase();

  // 1. Create the confirmed user (no email is sent).
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (createError || !created?.user) {
    throw new Error(createError?.message ?? 'Could not create the account');
  }

  const userId = created.user.id;

  // 2. Optionally link a team. Roll back the user if linking fails so we never
  //    leave an orphaned login that can't bid.
  try {
    if (input.team.mode === 'new') {
      const teamName = input.team.teamName.trim();
      if (!teamName) throw new Error('Enter a team name');
      const budget = input.team.budgetTotal ?? DEFAULT_BUDGET_M;
      const sortOrder = await nextSortOrder(supabase);

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          team_name: teamName,
          manager_name: displayName,
          budget_total: budget,
          sort_order: sortOrder,
          created_by: userId,
        })
        .select('id, team_name')
        .single();
      if (teamError || !team) throw new Error(teamError?.message ?? 'Could not create team');

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({ team_id: team.id, user_id: userId, slot: 1 });
      if (memberError) {
        await supabase.from('teams').delete().eq('id', team.id);
        throw new Error(memberError.message);
      }

      return { userId, email, displayName, teamId: team.id, teamName: team.team_name };
    }

    if (input.team.mode === 'existing') {
      const teamId = input.team.teamId;
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('id', teamId)
        .maybeSingle();
      if (teamError) throw new Error(teamError.message);
      if (!team) throw new Error('That team no longer exists');

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('slot')
        .eq('team_id', teamId);
      if (membersError) throw new Error(membersError.message);
      if ((members?.length ?? 0) >= TEAM_CAPACITY) throw new Error('That team is already full');

      const taken = new Set((members ?? []).map((m) => m.slot));
      const freeSlot = [1, 2].find((s) => !taken.has(s));
      if (!freeSlot) throw new Error('That team is already full');

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, user_id: userId, slot: freeSlot });
      if (memberError) throw new Error(memberError.message);

      return { userId, email, displayName, teamId: team.id, teamName: team.team_name };
    }

    // mode === 'none'
    return { userId, email, displayName, teamId: null, teamName: null };
  } catch (err) {
    // Undo the account so the admin can retry cleanly.
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
    throw err;
  }
}
