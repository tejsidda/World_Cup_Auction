export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  country: string;
  position: Position;
  points: number;
  fifaId?: number;
  squadId?: number;
  /** Auction hammer price in millions */
  price?: number;
}

export interface TeamMemberInfo {
  userId: string;
  displayName: string;
  isCreator: boolean;
}

export interface Manager {
  id: string;
  name: string;
  teamName: string;
  budgetTotal: number;
  totalPoints: number;
  pointsLast24h: number;
  history: number[];
  squadCount: number;
  roster: Player[];
  topAsset: Player;
  members: TeamMemberInfo[];
}

export type PoolStats = {
  total: number;
  available: number;
  onBlock: number;
  sold: number;
  skipped?: number;
};
