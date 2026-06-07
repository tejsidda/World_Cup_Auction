import type { Position } from '../types';

export type AuctionStatus = 'available' | 'on_block' | 'sold' | 'skipped';

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

export type LotStatus = 'open' | 'resolved' | 'void';

export type RevealedBid = {
  teamId: string;
  teamName: string;
  amount: number | null; // null = pass
};

export type LotResult = {
  sold: boolean;
  teamName: string | null;
  amount: number | null;
};

export type CurrentLotState = {
  lotId: string | null;
  status: LotStatus | 'none';
  player: PoolPlayer | null;
  bidCount: number; // teams that have acted (bid or pass) — count only, while open
  myBidExists: boolean;
  myBidAmount: number | null; // null + exists = pass
  bids: RevealedBid[] | null; // populated only when resolved (reveal all)
  result: LotResult | null;
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
