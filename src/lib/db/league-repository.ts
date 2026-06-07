import { getSupabase } from '../supabase/client';
import type { DbTeamRow } from '../supabase/types';
import type { Manager } from '../../types';
import { mapTeamsToLeague } from './mappers';

const LEAGUE_SELECT = `
  id,
  manager_name,
  team_name,
  budget_total,
  points_last_24h,
  sort_order,
  created_by,
  players (
    id,
    team_id,
    name,
    country,
    position,
    points,
    price_m,
    fifa_id,
    squad_id
  ),
  team_point_history (
    total_points,
    recorded_at
  ),
  team_members (
    slot,
    user_id,
    profiles ( display_name )
  )
`;

export async function fetchLeague(): Promise<Manager[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('teams')
    .select(LEAGUE_SELECT)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return mapTeamsToLeague((data ?? []) as DbTeamRow[]);
}
