import type { FifaPlayer, FifaSquad } from './types';

const FIFA_BASE = 'https://play.fifa.com/json/fantasy';
const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'WC26FantasyAuction/1.0',
};

export async function fetchFifaSquads(): Promise<FifaSquad[]> {
  const res = await fetch(`${FIFA_BASE}/squads.json`, {
    headers: FETCH_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`FIFA squads fetch failed (${res.status})`);
  }

  return res.json();
}

export async function fetchFifaPlayers(): Promise<FifaPlayer[]> {
  const res = await fetch(`${FIFA_BASE}/players.json`, {
    headers: FETCH_HEADERS,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`FIFA players fetch failed (${res.status})`);
  }

  return res.json();
}

export async function fetchFifaCatalog() {
  const [squads, players] = await Promise.all([fetchFifaSquads(), fetchFifaPlayers()]);
  return { squads, players };
}
