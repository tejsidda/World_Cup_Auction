export type DbPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type DbPlayerRow = {
  id: string;
  team_id: string;
  name: string;
  country: string;
  position: DbPosition;
  points: number;
  price_m: number | null;
  fifa_id: number | null;
  squad_id: number | null;
};

export type DbPointHistoryRow = {
  total_points: number;
  recorded_at: string;
};

export type DbTeamRow = {
  id: string;
  manager_name: string;
  team_name: string;
  budget_total: number;
  points_last_24h: number;
  sort_order: number;
  players: DbPlayerRow[];
  team_point_history: DbPointHistoryRow[];
};

export type DbPoolPlayerRow = {
  fifa_id: number;
  display_name: string;
  country_abbr: string;
  squad_id: number;
  position: DbPosition;
  fifa_status: string | null;
  auction_status: 'available' | 'sold';
  points: number;
};
