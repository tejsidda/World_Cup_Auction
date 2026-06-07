import { createServerSupabase } from '../supabase/server';
import { fetchFifaCatalog } from '../fifa/client';
import { mergeFifaPlayers, type FifaPlayerDisplay } from '../fifa/types';

const UPSERT_BATCH = 400;

type PoolRow = {
  fifa_id: number;
  display_name: string;
  country_abbr: string;
  squad_id: number;
  position: string;
  fifa_status: string;
  auction_status: string;
  points: number;
};

function toPoolRow(
  p: FifaPlayerDisplay,
  auctionStatus: 'available' | 'sold' | 'on_block'
): PoolRow {
  return {
    fifa_id: p.fifaId,
    display_name: p.displayName,
    country_abbr: p.countryAbbr,
    squad_id: p.squadId,
    position: p.position,
    fifa_status: p.fifaStatus,
    auction_status: auctionStatus,
    points: p.points,
  };
}

export async function importFifaPool(): Promise<{ imported: number; available: number; sold: number }> {
  const supabase = createServerSupabase();
  const { squads, players } = await fetchFifaCatalog();
  const merged = mergeFifaPlayers(players, squads);

  const { data: existing, error: existingError } = await supabase
    .from('pool_players')
    .select('fifa_id, auction_status');

  if (existingError) {
    throw new Error(existingError.message);
  }

  const soldIds = new Set(
    (existing ?? []).filter((r) => r.auction_status === 'sold').map((r) => r.fifa_id)
  );
  const onBlockIds = new Set(
    (existing ?? []).filter((r) => r.auction_status === 'on_block').map((r) => r.fifa_id)
  );

  const rows = merged.map((p) => {
    let status: 'available' | 'sold' | 'on_block' = 'available';
    if (soldIds.has(p.fifaId)) status = 'sold';
    else if (onBlockIds.has(p.fifaId)) status = 'on_block';
    return toPoolRow(p, status);
  });

  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    const { error } = await supabase.from('pool_players').upsert(batch, {
      onConflict: 'fifa_id',
      ignoreDuplicates: false,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  const available = rows.filter((r) => r.auction_status === 'available').length;
  const sold = rows.filter((r) => r.auction_status === 'sold').length;

  return { imported: rows.length, available, sold };
}

export type PoolStats = {
  total: number;
  available: number;
  onBlock: number;
  sold: number;
};

export async function getPoolStats(): Promise<PoolStats> {
  const supabase = createServerSupabase();

  const { count: total, error: totalError } = await supabase
    .from('pool_players')
    .select('*', { count: 'exact', head: true });

  if (totalError) throw new Error(totalError.message);

  const { count: available, error: availError } = await supabase
    .from('pool_players')
    .select('*', { count: 'exact', head: true })
    .eq('auction_status', 'available');

  if (availError) throw new Error(availError.message);

  const { count: onBlock, error: blockError } = await supabase
    .from('pool_players')
    .select('*', { count: 'exact', head: true })
    .eq('auction_status', 'on_block');

  if (blockError) throw new Error(blockError.message);

  const { count: sold, error: soldError } = await supabase
    .from('pool_players')
    .select('*', { count: 'exact', head: true })
    .eq('auction_status', 'sold');

  if (soldError) throw new Error(soldError.message);

  return {
    total: total ?? 0,
    available: available ?? 0,
    onBlock: onBlock ?? 0,
    sold: sold ?? 0,
  };
}

export async function syncRosterPointsFromFifa(): Promise<{ updated: number }> {
  const supabase = createServerSupabase();
  const { players } = await fetchFifaCatalog();

  const pointsByFifaId = new Map(players.map((p) => [p.id, p.stats?.totalPoints ?? 0]));

  const { data: roster, error: rosterError } = await supabase
    .from('players')
    .select('id, fifa_id')
    .not('fifa_id', 'is', null);

  if (rosterError) throw new Error(rosterError.message);

  let updated = 0;

  for (const row of roster ?? []) {
    if (row.fifa_id == null) continue;
    const points = pointsByFifaId.get(row.fifa_id);
    if (points === undefined) continue;

    const { error } = await supabase
      .from('players')
      .update({ points })
      .eq('id', row.id);

    if (error) throw new Error(error.message);
    updated++;
  }

  return { updated };
}
