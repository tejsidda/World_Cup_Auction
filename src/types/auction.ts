import type { Position } from '../types';

export type AuctionStatus = 'available' | 'on_block' | 'sold';

export type AuctionPhase = 'setup' | 'in_progress';

export type NationDrawRule =
  | { mode: 'whole' }
  | { mode: 'pick'; playerIds: number[] };

export type DrawSettings = {
  drawCountries: string[];
  drawRules: Record<string, NationDrawRule>;
};

export type AuctionState = {
  phase: AuctionPhase;
  startedAt: string | null;
  drawSettings: DrawSettings;
};

export type PoolPlayer = {
  fifaId: number;
  displayName: string;
  countryAbbr: string;
  squadId: number;
  position: Position;
  auctionStatus: AuctionStatus;
  points: number;
};

export type PoolNation = {
  abbr: string;
  count: number;
  available: number;
};

export type SoldRecord = {
  id: string;
  fifaId: number;
  playerName: string;
  countryAbbr: string;
  squadId?: number;
  position: Position;
  priceM: number;
  teamId: string;
  teamName: string;
  soldAt: string;
};
