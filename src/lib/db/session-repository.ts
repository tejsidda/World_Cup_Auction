import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_BUDGET_M } from '@/config/constants';
import type { SessionState, SessionTeam, SessionStatus } from '@/types/session';

const TEAM_CAPACITY = 2;

type TeamRow = {
  id: string;
  team_name: string;
  created_by: string | null;
  created_at: string;
  team_members: {
    slot: number;
    user_id: string;
    profiles: { display_name: string } | null;
  }[];
};

function mapTeam(row: TeamRow): SessionTeam {
  const members = (row.team_members ?? [])
    .map((m) => ({
      userId: m.user_id,
      displayName: m.profiles?.display_name ?? 'Player',
      slot: m.slot,
    }))
    .sort((a, b) => a.slot - b.slot);

  return {
    id: row.id,
    name: row.team_name,
    createdBy: row.created_by,
    members,
    full: members.length >= TEAM_CAPACITY,
  };
}

async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  return data?.is_admin === true;
}

async function getSessionStatus(supabase: SupabaseClient): Promise<{
  status: SessionStatus;
  startedAt: string | null;
}> {
  const { data } = await supabase
    .from('auction_sessions')
    .select('status, started_at')
    .eq('id', 1)
    .maybeSingle();

  return {
    status: (data?.status as SessionStatus) ?? 'lobby',
    startedAt: data?.started_at ?? null,
  };
}

export async function getSessionState(
  supabase: SupabaseClient,
  userId: string
): Promise<SessionState> {
  const [{ status, startedAt }, teamsRes] = await Promise.all([
    getSessionStatus(supabase),
    supabase
      .from('teams')
      .select(
        'id, team_name, created_by, created_at, team_members(slot, user_id, profiles(display_name))'
      )
      .order('created_at', { ascending: true }),
  ]);

  if (teamsRes.error) throw new Error(teamsRes.error.message);

  const teams = ((teamsRes.data ?? []) as unknown as TeamRow[]).map(mapTeam);

  const myTeam = teams.find((t) => t.members.some((m) => m.userId === userId));

  return {
    status,
    startedAt,
    teams,
    myTeamId: myTeam?.id ?? null,
  };
}

export async function getUserTeamId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.team_id ?? null;
}

async function getMyMembership(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, slot')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createTeam(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<string> {
  const teamName = name.trim();
  if (!teamName) throw new Error('Enter a team name');
  if (teamName.length > 40) throw new Error('Team name is too long');

  const existing = await getMyMembership(supabase, userId);
  if (existing) throw new Error('You are already on a team. Leave it first.');

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      team_name: teamName,
      manager_name: teamName,
      budget_total: DEFAULT_BUDGET_M,
      created_by: userId,
    })
    .select('id')
    .single();

  if (teamError) throw new Error(teamError.message);

  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: userId,
    slot: 1,
  });

  if (memberError) {
    // Roll back the orphan team if membership failed
    await supabase.from('teams').delete().eq('id', team.id);
    throw new Error(memberError.message);
  }

  return team.id;
}

export async function joinTeam(
  supabase: SupabaseClient,
  userId: string,
  teamId: string
): Promise<void> {
  const existing = await getMyMembership(supabase, userId);
  if (existing) throw new Error('You are already on a team. Leave it first.');

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('slot')
    .eq('team_id', teamId);

  if (membersError) throw new Error(membersError.message);
  if (!members) throw new Error('Team not found');
  if (members.length >= TEAM_CAPACITY) throw new Error('That team is already full');

  const takenSlots = new Set(members.map((m) => m.slot));
  const freeSlot = [1, 2].find((s) => !takenSlots.has(s));
  if (!freeSlot) throw new Error('That team is already full');

  const { error: insertError } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
    slot: freeSlot,
  });

  if (insertError) throw new Error(insertError.message);
}

export async function leaveTeam(supabase: SupabaseClient, userId: string): Promise<void> {
  const membership = await getMyMembership(supabase, userId);
  if (!membership) return;

  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('id', membership.id);

  if (deleteError) throw new Error(deleteError.message);

  // If the team is now empty, remove it so the lobby stays clean
  const { data: remaining, error: remainingError } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', membership.team_id);

  if (remainingError) throw new Error(remainingError.message);

  if (!remaining || remaining.length === 0) {
    await supabase.from('teams').delete().eq('id', membership.team_id);
  }
}

export async function startSession(supabase: SupabaseClient, userId: string): Promise<void> {
  if (!(await isAdmin(supabase, userId))) {
    throw new Error('Only the admin can start the auction');
  }

  const { status } = await getSessionStatus(supabase);
  if (status !== 'lobby') throw new Error('Auction already started');

  const { error } = await supabase
    .from('auction_sessions')
    .update({ status: 'live', started_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) throw new Error(error.message);
}

export async function resetSession(supabase: SupabaseClient, userId: string): Promise<void> {
  if (!(await isAdmin(supabase, userId))) {
    throw new Error('Only the admin can reset the lobby');
  }

  const { error } = await supabase
    .from('auction_sessions')
    .update({ status: 'lobby', started_at: null, ended_at: null })
    .eq('id', 1);

  if (error) throw new Error(error.message);
}
