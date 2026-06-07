import { DEFAULT_BUDGET_M } from '../../config/constants';
import { getSupabase } from '../supabase/client';

export type CreateTeamInput = {
  managerName: string;
  teamName: string;
  budgetTotal?: number;
  sortOrder?: number;
};

async function getNextSortOrder(): Promise<number> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('teams')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.sort_order ?? 0) + 1;
}

export async function createTeam(input: CreateTeamInput): Promise<string> {
  const managerName = input.managerName.trim();
  const teamName = input.teamName.trim();

  if (!managerName || !teamName) {
    throw new Error('Manager name and team name are required.');
  }

  const sortOrder = input.sortOrder ?? (await getNextSortOrder());
  const budgetTotal = input.budgetTotal ?? DEFAULT_BUDGET_M;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('teams')
    .insert({
      manager_name: managerName,
      team_name: teamName,
      budget_total: budgetTotal,
      sort_order: sortOrder,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

export type UpdateTeamInput = {
  managerName: string;
  teamName: string;
  budgetTotal: number;
};

export async function updateTeam(teamId: string, input: UpdateTeamInput): Promise<void> {
  const managerName = input.managerName.trim();
  const teamName = input.teamName.trim();

  if (!managerName || !teamName) {
    throw new Error('Manager name and team name are required.');
  }

  if (!Number.isFinite(input.budgetTotal) || input.budgetTotal <= 0) {
    throw new Error('Budget must be a positive number.');
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('teams')
    .update({
      manager_name: managerName,
      team_name: teamName,
      budget_total: input.budgetTotal,
    })
    .eq('id', teamId);

  if (error) throw new Error(error.message);
}

export async function deleteTeam(teamId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('teams').delete().eq('id', teamId);
  if (error) throw new Error(error.message);
}
