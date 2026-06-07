import { pickTopAsset, sortByStandings } from '../league';
import type { DbTeamRow } from '../supabase/types';
import type { Manager, Player, TeamMemberInfo } from '../../types';

const HISTORY_LIMIT = 15;
const MIN_HISTORY_POINTS = 7;

function mapPlayer(row: DbTeamRow['players'][number]): Player {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    position: row.position,
    points: row.points,
    fifaId: row.fifa_id ?? undefined,
    squadId: row.squad_id ?? undefined,
    price: row.price_m ?? undefined,
  };
}

function mapHistory(rows: DbTeamRow['team_point_history'], totalPoints: number): number[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const values = sorted.map((r) => r.total_points);

  if (values.length >= MIN_HISTORY_POINTS) {
    return values.slice(-HISTORY_LIMIT);
  }

  const pad = Array(MIN_HISTORY_POINTS - values.length).fill(0);
  return [...pad, ...values].slice(-HISTORY_LIMIT);
}

function mapMembers(row: DbTeamRow): TeamMemberInfo[] {
  return (row.team_members ?? [])
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((m) => {
      const profiles = m.profiles;
      const displayName = Array.isArray(profiles)
        ? profiles[0]?.display_name
        : profiles?.display_name;
      return {
        userId: m.user_id,
        displayName: displayName ?? 'Player',
        isCreator: m.user_id === row.created_by,
      };
    });
}

export function mapTeamRowToManager(row: DbTeamRow): Manager {
  const roster = row.players.map(mapPlayer);
  const totalPoints = roster.reduce((sum, p) => sum + p.points, 0);

  const manager: Manager = {
    id: row.id,
    name: row.manager_name,
    teamName: row.team_name,
    budgetTotal: Number(row.budget_total),
    roster,
    squadCount: roster.length,
    totalPoints,
    pointsLast24h: row.points_last_24h,
    history: mapHistory(row.team_point_history, totalPoints),
    topAsset: pickTopAsset(roster),
    members: mapMembers(row),
  };

  return manager;
}

export function mapTeamsToLeague(rows: DbTeamRow[]): Manager[] {
  return sortByStandings(rows.map(mapTeamRowToManager));
}
