import { createServerSupabase } from '../supabase/server';
import { createServiceSupabase } from '../supabase/service';
import { SQUAD_SIZE } from '../../config/constants';
import type {
  AuctionPhase,
  AuctionState,
  AuctionStatus,
  CurrentLotState,
  DrawSettings,
  LotResult,
  NationDrawRule,
  PoolNation,
  PoolPlayer,
  RevealedBid,
  SoldRecord,
} from '../../types/auction';
import type { Position } from '../../types';

type PoolRow = {
  fifa_id: number;
  display_name: string;
  country_abbr: string;
  squad_id: number;
  position: Position;
  auction_status: AuctionStatus;
  points: number;
};

function mapPoolRow(row: PoolRow): PoolPlayer {
  return {
    fifaId: row.fifa_id,
    displayName: row.display_name,
    countryAbbr: row.country_abbr,
    squadId: row.squad_id,
    position: row.position,
    auctionStatus: row.auction_status,
    points: row.points,
  };
}

function parseDrawRules(raw: unknown): Record<string, NationDrawRule> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const rules: Record<string, NationDrawRule> = {};
  for (const [abbr, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const rule = value as { mode?: string; playerIds?: unknown };
    if (rule.mode === 'whole') {
      rules[abbr] = { mode: 'whole' };
    } else if (rule.mode === 'pick' && Array.isArray(rule.playerIds)) {
      const playerIds = rule.playerIds.filter((id): id is number => typeof id === 'number');
      if (playerIds.length > 0) rules[abbr] = { mode: 'pick', playerIds };
    }
  }
  return rules;
}

function mapSettingsRow(row: {
  status?: string;
  started_at?: string | null;
  draw_countries?: string[];
  draw_rules?: unknown;
}): AuctionState {
  return {
    phase: (row.status as AuctionPhase) ?? 'setup',
    startedAt: row.started_at ?? null,
    drawSettings: {
      drawCountries: row.draw_countries ?? [],
      drawRules: parseDrawRules(row.draw_rules),
    },
  };
}

export async function getAuctionState(): Promise<AuctionState> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('auction_settings')
    .select('status, started_at, draw_countries, draw_rules')
    .eq('id', 1)
    .single();

  if (error) {
    if (error.message.includes('draw_rules') || error.message.includes('status')) {
      const { data: legacy, error: legacyError } = await supabase
        .from('auction_settings')
        .select('draw_countries')
        .eq('id', 1)
        .single();
      if (legacyError) throw new Error(legacyError.message);
      return {
        phase: 'setup',
        startedAt: null,
        drawSettings: { drawCountries: legacy?.draw_countries ?? [], drawRules: {} },
      };
    }
    throw new Error(error.message);
  }
  return mapSettingsRow(data ?? {});
}

export async function getDrawSettings(): Promise<DrawSettings> {
  const state = await getAuctionState();
  return state.drawSettings;
}

export async function saveDrawSettings(
  drawCountries: string[],
  drawRules: Record<string, NationDrawRule> = {}
): Promise<DrawSettings> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('auction_settings')
    .update({
      draw_countries: drawCountries,
      draw_rules: drawRules,
    })
    .eq('id', 1)
    .select('draw_countries, draw_rules')
    .single();

  if (error) throw new Error(error.message);
  return {
    drawCountries: data?.draw_countries ?? [],
    drawRules: parseDrawRules(data?.draw_rules),
  };
}

export async function getPoolPlayersByCountry(countryAbbr: string): Promise<PoolPlayer[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .eq('country_abbr', countryAbbr)
    .in('auction_status', ['available', 'on_block', 'skipped'])
    .order('display_name');

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPoolRow(row as PoolRow));
}

async function countEligibleDrawPlayers(settings: DrawSettings): Promise<number> {
  const supabase = createServerSupabase();
  if (settings.drawCountries.length === 0) return 0;

  const { data, error } = await supabase
    .from('pool_players')
    .select('fifa_id, country_abbr')
    .eq('auction_status', 'available')
    .in('country_abbr', settings.drawCountries);

  if (error) throw new Error(error.message);
  if (!data?.length) return 0;

  let count = 0;
  for (const row of data) {
    const rule = settings.drawRules[row.country_abbr];
    if (!rule || rule.mode === 'whole') {
      count++;
    } else if (rule.mode === 'pick' && rule.playerIds.includes(row.fifa_id)) {
      count++;
    }
  }
  return count;
}

export async function startAuction(teamCount: number): Promise<AuctionState> {
  if (teamCount < 1) {
    throw new Error('Add at least one franchise before starting the auction');
  }

  const state = await getAuctionState();
  if (state.phase === 'in_progress') {
    throw new Error('Auction is already in progress');
  }

  const { drawSettings } = state;
  if (drawSettings.drawCountries.length === 0) {
    throw new Error('Select at least one nation for the draw pool');
  }

  const eligible = await countEligibleDrawPlayers(drawSettings);
  if (eligible === 0) {
    throw new Error('No eligible players in the selected draw pool');
  }

  const supabase = createServerSupabase();
  const { data: poolCheck } = await supabase.from('pool_players').select('fifa_id').limit(1);
  if (!poolCheck?.length) {
    throw new Error('Import the FIFA player pool in Admin first');
  }

  const { data, error } = await supabase
    .from('auction_settings')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select('status, started_at, draw_countries, draw_rules')
    .single();

  if (error) throw new Error(error.message);
  return mapSettingsRow(data);
}

export async function getPoolNations(): Promise<PoolNation[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pool_players')
    .select('country_abbr, auction_status');

  if (error) throw new Error(error.message);

  const map = new Map<string, { count: number; available: number }>();
  for (const row of data ?? []) {
    const entry = map.get(row.country_abbr) ?? { count: 0, available: 0 };
    entry.count++;
    if (row.auction_status === 'available') entry.available++;
    map.set(row.country_abbr, entry);
  }

  return [...map.entries()]
    .map(([abbr, stats]) => ({ abbr, count: stats.count, available: stats.available }))
    .sort((a, b) => a.abbr.localeCompare(b.abbr));
}

export async function getOnBlockPlayer(): Promise<PoolPlayer | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .eq('auction_status', 'on_block')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPoolRow(data as PoolRow) : null;
}

/**
 * Move the current on-block player aside as "skipped" (not sold) so the random
 * draw won't surface them again. The admin can still search + call them up.
 */
async function clearOnBlock(): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('pool_players')
    .update({ auction_status: 'skipped' })
    .eq('auction_status', 'on_block');

  if (error) throw new Error(error.message);
}

export async function callUpPlayer(fifaId: number): Promise<PoolPlayer> {
  const supabase = createServerSupabase();

  const { data: target, error: fetchError } = await supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .eq('fifa_id', fifaId)
    .single();

  if (fetchError || !target) {
    throw new Error('Player not found in pool');
  }

  if (target.auction_status === 'sold') {
    throw new Error('Player is already sold');
  }

  // Switching the player on the block invalidates any in-flight bidding.
  await voidOpenLots();
  await clearOnBlock();

  const { data, error } = await supabase
    .from('pool_players')
    .update({ auction_status: 'on_block' })
    .eq('fifa_id', fifaId)
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .single();

  if (error) throw new Error(error.message);
  return mapPoolRow(data as PoolRow);
}

function filterEligiblePlayers(
  rows: PoolRow[],
  drawSettings: DrawSettings
): PoolRow[] {
  return rows.filter((row) => {
    const rule = drawSettings.drawRules[row.country_abbr];
    if (!rule || rule.mode === 'whole') return true;
    if (rule.mode === 'pick') return rule.playerIds.includes(row.fifa_id);
    return false;
  });
}

export async function drawRandomPlayer(drawSettings: DrawSettings): Promise<PoolPlayer> {
  if (drawSettings.drawCountries.length === 0) {
    throw new Error('Select at least one nation for the draw');
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .eq('auction_status', 'available')
    .in('country_abbr', drawSettings.drawCountries);

  if (error) throw new Error(error.message);

  const eligible = filterEligiblePlayers((data ?? []) as PoolRow[], drawSettings);
  if (!eligible.length) {
    throw new Error('No available players in selected draw pool');
  }

  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  return callUpPlayer(pick.fifa_id);
}

export async function searchPoolPlayers(query: string, limit = 20): Promise<PoolPlayer[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .ilike('display_name', `%${q}%`)
    .in('auction_status', ['available', 'on_block', 'skipped'])
    .order('display_name')
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPoolRow(row as PoolRow));
}

export async function searchUnassignedPoolPlayers(
  query: string,
  limit = 30
): Promise<PoolPlayer[]> {
  const supabase = createServerSupabase();
  let q = supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .in('auction_status', ['available', 'skipped'])
    .order('display_name')
    .limit(limit);

  const trimmed = query.trim();
  if (trimmed.length >= 2) {
    q = q.ilike('display_name', `%${trimmed}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPoolRow(row as PoolRow));
}

export async function replacePlayer(
  existingPlayerId: string,
  replacementFifaId: number,
  teamId: string
): Promise<{ replacedName: string; replacementName: string }> {
  const supabase = createServerSupabase();

  const { data: existing, error: fetchErr } = await supabase
    .from('players')
    .select('id, name, fifa_id, team_id')
    .eq('id', existingPlayerId)
    .single();

  if (fetchErr || !existing) throw new Error('Player not found');
  if (existing.team_id !== teamId) throw new Error('Player does not belong to this franchise');

  const { data: replacement, error: poolErr } = await supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, points')
    .eq('fifa_id', replacementFifaId)
    .in('auction_status', ['available', 'skipped'])
    .single();

  if (poolErr || !replacement) {
    throw new Error('Replacement player not found or already assigned');
  }

  const { error: deleteErr } = await supabase
    .from('players')
    .delete()
    .eq('id', existingPlayerId);

  if (deleteErr) throw new Error(deleteErr.message);

  if (existing.fifa_id) {
    await supabase
      .from('pool_players')
      .update({ auction_status: 'available' })
      .eq('fifa_id', existing.fifa_id);
  }

  const { error: insertErr } = await supabase.from('players').insert({
    team_id: teamId,
    fifa_id: replacement.fifa_id,
    squad_id: replacement.squad_id,
    name: replacement.display_name,
    country: replacement.country_abbr,
    position: replacement.position,
    points: replacement.points,
    price_m: 0,
  });

  if (insertErr) throw new Error(insertErr.message);

  await supabase
    .from('pool_players')
    .update({ auction_status: 'sold' })
    .eq('fifa_id', replacementFifaId);

  return { replacedName: existing.name, replacementName: replacement.display_name };
}

export async function resetAuction(): Promise<{
  poolReset: number;
  rostersCleared: number;
}> {
  const supabase = createServerSupabase();
  const bidsDb = createServiceSupabase();

  await clearOnBlock();

  // Clear Phase 4 bidding state so the room resets to a clean slate.
  const { error: bidsDeleteError } = await bidsDb
    .from('bids')
    .delete()
    .gte('created_at', '1970-01-01');
  if (bidsDeleteError) throw new Error(bidsDeleteError.message);

  const { error: lotsVoidError } = await supabase
    .from('lots')
    .update({ status: 'void' })
    .neq('status', 'void');
  if (lotsVoidError) throw new Error(lotsVoidError.message);

  const { data: poolRows, error: poolFetchError } = await supabase
    .from('pool_players')
    .select('fifa_id')
    .in('auction_status', ['sold', 'on_block', 'skipped']);

  if (poolFetchError) throw new Error(poolFetchError.message);

  const { error: poolUpdateError } = await supabase
    .from('pool_players')
    .update({ auction_status: 'available' })
    .in('auction_status', ['sold', 'on_block', 'skipped']);

  if (poolUpdateError) throw new Error(poolUpdateError.message);

  const { data: rosterRows, error: rosterFetchError } = await supabase
    .from('players')
    .select('id');

  if (rosterFetchError) throw new Error(rosterFetchError.message);

  const rosterIds = (rosterRows ?? []).map((r) => r.id);
  let rostersCleared = 0;

  if (rosterIds.length > 0) {
    const { count, error: deleteError } = await supabase
      .from('players')
      .delete({ count: 'exact' })
      .in('id', rosterIds);

    if (deleteError) throw new Error(deleteError.message);
    rostersCleared = count ?? 0;

    if (rostersCleared < rosterIds.length) {
      throw new Error(
        `Only cleared ${rostersCleared} of ${rosterIds.length} roster players. ` +
          'Run supabase/migrations/004_auction_draw.sql (players_delete_anon policy).'
      );
    }
  }

  const { error: historyDeleteError } = await supabase
    .from('team_point_history')
    .delete()
    .gte('recorded_at', '1970-01-01');

  if (historyDeleteError && !historyDeleteError.message.includes('policy')) {
    throw new Error(historyDeleteError.message);
  }

  const { error: teamsResetError } = await supabase
    .from('teams')
    .update({ points_last_24h: 0 })
    .gte('created_at', '1970-01-01');

  if (teamsResetError) throw new Error(teamsResetError.message);

  const fullSettingsUpdate = await supabase
    .from('auction_settings')
    .update({
      status: 'setup',
      started_at: null,
      draw_countries: [],
      draw_rules: {},
    })
    .eq('id', 1);

  if (fullSettingsUpdate.error?.message.includes('draw_rules') ||
      fullSettingsUpdate.error?.message.includes('status')) {
    const legacyUpdate = await supabase
      .from('auction_settings')
      .update({ draw_countries: [] })
      .eq('id', 1);
    if (legacyUpdate.error) throw new Error(legacyUpdate.error.message);
  } else if (fullSettingsUpdate.error) {
    throw new Error(fullSettingsUpdate.error.message);
  }

  return {
    poolReset: poolRows?.length ?? 0,
    rostersCleared,
  };
}

async function getTeamAuctionState(teamId: string) {
  const supabase = createServerSupabase();

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, team_name, budget_total')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    throw new Error('Team not found');
  }

  const { data: roster, error: rosterError } = await supabase
    .from('players')
    .select('price_m')
    .eq('team_id', teamId);

  if (rosterError) throw new Error(rosterError.message);

  const squadCount = roster?.length ?? 0;
  const spent = (roster ?? []).reduce((sum, p) => sum + Number(p.price_m ?? 0), 0);
  const budgetTotal = Number(team.budget_total);
  const remaining = budgetTotal - spent;

  return { team, squadCount, spent, budgetTotal, remaining };
}

export async function sellOnBlockPlayer(
  teamId: string,
  priceM: number
): Promise<SoldRecord> {
  if (!teamId) throw new Error('Select a winning franchise');
  if (!Number.isFinite(priceM) || priceM <= 0) {
    throw new Error('Enter a valid hammer price');
  }

  const supabase = createServerSupabase();
  const onBlock = await getOnBlockPlayer();
  if (!onBlock) {
    throw new Error('No player is on the block');
  }

  const { team, squadCount, remaining } = await getTeamAuctionState(teamId);

  if (squadCount >= SQUAD_SIZE) {
    throw new Error(`${team.team_name} squad is full (${SQUAD_SIZE}/${SQUAD_SIZE})`);
  }

  if (priceM > remaining + 0.001) {
    throw new Error(
      `Insufficient budget — ${team.team_name} has $${remaining.toFixed(1)}M remaining`
    );
  }

  const { data: existing, error: dupError } = await supabase
    .from('players')
    .select('id')
    .eq('fifa_id', onBlock.fifaId)
    .maybeSingle();

  if (dupError) throw new Error(dupError.message);
  if (existing) {
    throw new Error('Player is already on a franchise roster');
  }

  const { data: inserted, error: insertError } = await supabase
    .from('players')
    .insert({
      team_id: teamId,
      fifa_id: onBlock.fifaId,
      squad_id: onBlock.squadId,
      name: onBlock.displayName,
      country: onBlock.countryAbbr,
      position: onBlock.position,
      points: onBlock.points,
      price_m: priceM,
    })
    .select('id, created_at')
    .single();

  if (insertError) throw new Error(insertError.message);

  const { error: poolError } = await supabase
    .from('pool_players')
    .update({ auction_status: 'sold' })
    .eq('fifa_id', onBlock.fifaId)
    .eq('auction_status', 'on_block');

  if (poolError) throw new Error(poolError.message);

  return {
    id: inserted.id,
    fifaId: onBlock.fifaId,
    playerName: onBlock.displayName,
    countryAbbr: onBlock.countryAbbr,
    squadId: onBlock.squadId,
    position: onBlock.position,
    priceM,
    teamId,
    teamName: team.team_name,
    soldAt: inserted.created_at,
  };
}

// ---------------------------------------------------------------------------
// Phase 4 — blind bidding (lots + bids)
// ---------------------------------------------------------------------------

const EPSILON = 0.001;

async function voidOpenLots(): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('lots')
    .update({ status: 'void' })
    .eq('status', 'open');
  if (error) throw new Error(error.message);
}

async function getPoolPlayerByFifaId(fifaId: number): Promise<PoolPlayer | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pool_players')
    .select('fifa_id, display_name, country_abbr, squad_id, position, auction_status, points')
    .eq('fifa_id', fifaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPoolRow(data as PoolRow) : null;
}

type OpenLotRow = { id: string; fifa_id: number; status: string };

async function getLatestLot(): Promise<{
  id: string;
  fifa_id: number;
  status: string;
  winning_team_id: string | null;
  winning_amount: number | null;
} | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('lots')
    .select('id, fifa_id, status, winning_team_id, winning_amount')
    .neq('status', 'void')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function getOpenLot(): Promise<OpenLotRow | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('lots')
    .select('id, fifa_id, status')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OpenLotRow) ?? null;
}

export async function openLot(): Promise<{ lotId: string }> {
  const supabase = createServerSupabase();
  const onBlock = await getOnBlockPlayer();
  if (!onBlock) throw new Error('Put a player on the block before opening bids');

  const existing = await getOpenLot();
  if (existing) {
    if (existing.fifa_id === onBlock.fifaId) return { lotId: existing.id };
    await voidOpenLots();
  }

  const { data, error } = await supabase
    .from('lots')
    .insert({ fifa_id: onBlock.fifaId, status: 'open' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { lotId: data.id };
}

export async function cancelCurrentLot(): Promise<void> {
  await voidOpenLots();
}

export async function submitBid(teamId: string, amount: number | null): Promise<void> {
  if (!teamId) throw new Error('You are not on a team');
  if (amount !== null) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid bid amount');
    }
  }

  const open = await getOpenLot();
  if (!open) throw new Error('Bidding is not open right now');

  // Validate affordability and squad room at submit time so bidders get
  // immediate feedback instead of being silently skipped at resolution.
  // Passes (amount === null) are always allowed.
  if (amount !== null) {
    const { team, squadCount, remaining } = await getTeamAuctionState(teamId);
    if (squadCount >= SQUAD_SIZE) {
      throw new Error(`${team.team_name} squad is full (${SQUAD_SIZE}/${SQUAD_SIZE})`);
    }
    if (amount > remaining + EPSILON) {
      throw new Error(
        `Bid exceeds budget — ${team.team_name} has $${remaining.toFixed(1)}M remaining`
      );
    }
  }

  // Best-effort guard against a lot that closed between read and write.
  const stillOpen = await getOpenLot();
  if (!stillOpen || stillOpen.id !== open.id) {
    throw new Error('Bidding just closed — your bid was not submitted');
  }

  const bidsDb = createServiceSupabase();
  const { error } = await bidsDb
    .from('bids')
    .upsert(
      { lot_id: open.id, team_id: teamId, amount },
      { onConflict: 'lot_id,team_id' }
    );

  if (error) throw new Error(error.message);
}

export async function closeAndResolveLot(): Promise<LotResult> {
  const supabase = createServerSupabase();
  const open = await getOpenLot();
  if (!open) throw new Error('No open bidding to close');

  const onBlock = await getOnBlockPlayer();

  const bidsDb = createServiceSupabase();
  const { data: bidRows, error: bidError } = await bidsDb
    .from('bids')
    .select('team_id, amount, created_at')
    .eq('lot_id', open.id)
    .not('amount', 'is', null)
    .order('amount', { ascending: false })
    .order('created_at', { ascending: true });

  if (bidError) throw new Error(bidError.message);

  // Find the highest bid whose team can still afford it and has squad room.
  let winner: { team_id: string; amount: number } | null = null;
  for (const row of bidRows ?? []) {
    const amount = Number(row.amount);
    const { squadCount, remaining } = await getTeamAuctionState(row.team_id);
    if (squadCount < SQUAD_SIZE && amount <= remaining + EPSILON) {
      winner = { team_id: row.team_id, amount };
      break;
    }
  }

  if (winner && onBlock) {
    const sale = await sellOnBlockPlayer(winner.team_id, winner.amount);
    const { error } = await supabase
      .from('lots')
      .update({
        status: 'resolved',
        winning_team_id: winner.team_id,
        winning_amount: winner.amount,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', open.id);
    if (error) throw new Error(error.message);
    return { sold: true, teamName: sale.teamName, amount: winner.amount };
  }

  // No valid bid — set the player aside (skipped) and resolve unsold.
  await clearOnBlock();
  const { error } = await supabase
    .from('lots')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', open.id);
  if (error) throw new Error(error.message);

  return { sold: false, teamName: null, amount: null };
}

export async function getCurrentLotState(teamId: string | null): Promise<CurrentLotState> {
  const supabase = createServerSupabase();
  const bidsDb = createServiceSupabase();
  const empty: CurrentLotState = {
    lotId: null,
    status: 'none',
    player: null,
    bidCount: 0,
    myBidExists: false,
    myBidAmount: null,
    bids: null,
    result: null,
  };

  const [onBlock, lot] = await Promise.all([getOnBlockPlayer(), getLatestLot()]);

  async function myBidFor(lotId: string) {
    if (!teamId) return { myBidExists: false, myBidAmount: null };
    const { data } = await bidsDb
      .from('bids')
      .select('amount')
      .eq('lot_id', lotId)
      .eq('team_id', teamId)
      .maybeSingle();
    if (!data) return { myBidExists: false, myBidAmount: null };
    return { myBidExists: true, myBidAmount: data.amount === null ? null : Number(data.amount) };
  }

  // A player is on the block.
  if (onBlock) {
    if (lot && lot.status === 'open' && lot.fifa_id === onBlock.fifaId) {
      const { count } = await bidsDb
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', lot.id)
        .not('amount', 'is', null);
      const mine = await myBidFor(lot.id);
      return {
        lotId: lot.id,
        status: 'open',
        player: onBlock,
        bidCount: count ?? 0,
        myBidExists: mine.myBidExists,
        myBidAmount: mine.myBidAmount,
        bids: null,
        result: null,
      };
    }
    // On the block but bidding not opened yet.
    return { ...empty, player: onBlock };
  }

  // Nothing on the block — surface the most recent resolved lot's result.
  if (lot && lot.status === 'resolved') {
    const player = await getPoolPlayerByFifaId(lot.fifa_id);

    const { data: rows, error } = await bidsDb
      .from('bids')
      .select('team_id, amount, teams(team_name)')
      .eq('lot_id', lot.id)
      .order('amount', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);

    const bids: RevealedBid[] = (rows ?? []).map((r) => {
      const teams = r.teams as { team_name: string } | { team_name: string }[] | null;
      const teamName = Array.isArray(teams) ? teams[0]?.team_name : teams?.team_name;
      return {
        teamId: r.team_id,
        teamName: teamName ?? '—',
        amount: r.amount === null ? null : Number(r.amount),
      };
    });

    const winnerBid = bids.find((b) => b.teamId === lot.winning_team_id);
    const mine = await myBidFor(lot.id);

    return {
      lotId: lot.id,
      status: 'resolved',
      player,
      bidCount: bids.length,
      myBidExists: mine.myBidExists,
      myBidAmount: mine.myBidAmount,
      bids,
      result: {
        sold: Boolean(lot.winning_team_id),
        teamName: winnerBid?.teamName ?? null,
        amount: lot.winning_amount === null ? null : Number(lot.winning_amount),
      },
    };
  }

  return empty;
}

export async function getRecentSales(limit = 10): Promise<SoldRecord[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('players')
    .select(
      `
      id,
      fifa_id,
      squad_id,
      name,
      country,
      position,
      price_m,
      created_at,
      team_id,
      teams ( team_name )
    `
    )
    .not('fifa_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const teams = row.teams as { team_name: string } | { team_name: string }[] | null;
    const teamName = Array.isArray(teams) ? teams[0]?.team_name : teams?.team_name;

    return {
      id: row.id,
      fifaId: row.fifa_id!,
      playerName: row.name,
      countryAbbr: row.country,
      squadId: row.squad_id ?? undefined,
      position: row.position as Position,
      priceM: Number(row.price_m ?? 0),
      teamId: row.team_id,
      teamName: teamName ?? '—',
      soldAt: row.created_at,
    };
  });
}
