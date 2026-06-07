-- Auction pool (FIFA catalog) + roster link to FIFA ids
-- Run after 002_teams_admin_insert.sql

-- ---------------------------------------------------------------------------
-- Pool: all FIFA players available for auction
-- ---------------------------------------------------------------------------
create table public.pool_players (
  fifa_id integer primary key,
  display_name text not null,
  country_abbr text not null,
  squad_id integer not null,
  position text not null check (position in ('GK', 'DEF', 'MID', 'FWD')),
  fifa_status text,
  auction_status text not null default 'available'
    check (auction_status in ('available', 'sold')),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pool_players_auction_status_idx on public.pool_players (auction_status);
create index pool_players_position_idx on public.pool_players (position);

create trigger pool_players_updated_at
  before update on public.pool_players
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Roster players: link to FIFA for points sync
-- ---------------------------------------------------------------------------
alter table public.players
  add column if not exists fifa_id integer unique;

alter table public.players drop column if exists tier;

-- ---------------------------------------------------------------------------
-- RLS: pool read + write for import / auction (anon)
-- ---------------------------------------------------------------------------
alter table public.pool_players enable row level security;

create policy "pool_players_select_anon"
  on public.pool_players for select
  to anon, authenticated
  using (true);

create policy "pool_players_insert_anon"
  on public.pool_players for insert
  to anon, authenticated
  with check (true);

create policy "pool_players_update_anon"
  on public.pool_players for update
  to anon, authenticated
  using (true)
  with check (true);

-- Roster points updates from sync
create policy "players_update_anon"
  on public.players for update
  to anon, authenticated
  using (true)
  with check (true);
