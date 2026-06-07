import type { Position } from '../types';

/** Max franchises in the league */
export const MAX_TEAMS = 8;

/** Max players per franchise roster */
export const SQUAD_SIZE = 40;

/** Default auction purse (millions) — used until real spend data exists */
export const DEFAULT_BUDGET_M = 200;

/** Placeholder spend estimate per squad slot until players have prices */
export const PLACEHOLDER_SLOT_COST_M = 12.5;

/** Required roster slots by position */
export const ROSTER_QUOTAS: Record<Position, number> = {
  GK: 2,
  DEF: 10,
  MID: 10,
  FWD: 8,
};
