export const FIFA_SQUAD_FLAG_BASE = 'https://play.fifa.com/media/image/fantasy/squads';

/** FIFA squad badge URL — keyed by squads.json `abbr` (e.g. SCO, ENG). */
export function squadFlagUrl(abbr: string): string {
  return `${FIFA_SQUAD_FLAG_BASE}/${abbr.trim().toUpperCase()}.png`;
}

/** FIFA national team jersey — keyed by squads.json `id` (e.g. 21 for Ghana). */
export function squadJerseyUrl(squadId: number): string {
  return `${FIFA_SQUAD_FLAG_BASE}/${squadId}.png`;
}
