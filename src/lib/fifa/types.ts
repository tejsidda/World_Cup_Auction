export type FifaSquad = {
  id: number;
  name: string;
  group: string;
  abbr: string;
  isEliminated: boolean;
};

export type FifaPlayer = {
  id: number;
  firstName: string;
  lastName: string;
  knownName: string | null;
  squadId: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  status: string;
  stats: {
    totalPoints: number;
  };
};

export type FifaPlayerDisplay = {
  fifaId: number;
  displayName: string;
  countryAbbr: string;
  squadId: number;
  position: FifaPlayer['position'];
  fifaStatus: string;
  points: number;
};

export function fifaDisplayName(player: FifaPlayer): string {
  if (player.knownName?.trim()) return player.knownName.trim();
  return `${player.firstName} ${player.lastName}`.trim();
}

export function mergeFifaPlayers(
  players: FifaPlayer[],
  squads: FifaSquad[]
): FifaPlayerDisplay[] {
  const abbrBySquadId = new Map(squads.map((s) => [s.id, s.abbr]));

  return players.map((p) => ({
    fifaId: p.id,
    displayName: fifaDisplayName(p),
    countryAbbr: abbrBySquadId.get(p.squadId) ?? '—',
    squadId: p.squadId,
    position: p.position,
    fifaStatus: p.status,
    points: p.stats?.totalPoints ?? 0,
  }));
}
