import type { Manager, Player } from '../types';

const EMPTY_PLAYER: Player = {
  id: 'placeholder',
  name: '—',
  country: '—',
  position: 'MID',
  points: 0,
};

export function pickTopAsset(roster: Player[]): Player {
  if (roster.length === 0) return EMPTY_PLAYER;
  return [...roster].sort((a, b) => b.points - a.points)[0];
}

export function sortByStandings(managers: Manager[]): Manager[] {
  return [...managers].sort((a, b) => b.totalPoints - a.totalPoints);
}

export function syncManagerDerivedFields(manager: Manager): Manager {
  const totalPoints = manager.roster.reduce((sum, p) => sum + p.points, 0);
  return {
    ...manager,
    totalPoints,
    squadCount: manager.roster.length,
    topAsset: pickTopAsset(manager.roster),
  };
}
