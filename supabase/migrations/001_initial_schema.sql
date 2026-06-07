-- WC26 Fantasy Auction — initial schema
-- Run in Supabase Dashboard → SQL → New query

-- ---------------------------------------------------------------------------
-- Teams (franchises)
-- ---------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  manager_name text not null,
  team_name text not null,
  budget_total numeric(10, 2) not null default 200,
  points_last_24h integer not null default 0,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teams_sort_order_idx on public.teams (sort_order);

-- ---------------------------------------------------------------------------
-- Players (roster slots per team)
-- ---------------------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  country text not null,
  position text not null check (position in ('GK', 'DEF', 'MID', 'FWD')),
  tier text not null check (tier in ('gold', 'silver', 'bronze')),
  points integer not null default 0,
  price_m numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index players_team_id_idx on public.players (team_id);

-- ---------------------------------------------------------------------------
-- Standings history (sparklines)
-- ---------------------------------------------------------------------------
create table public.team_point_history (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  total_points integer not null,
  recorded_at timestamptz not null default now()
);

create index team_point_history_team_recorded_idx
  on public.team_point_history (team_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

create trigger players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (read-only anon for dashboard; manage data in Dashboard)
-- ---------------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.team_point_history enable row level security;

create policy "teams_select_anon"
  on public.teams for select
  to anon, authenticated
  using (true);

create policy "players_select_anon"
  on public.players for select
  to anon, authenticated
  using (true);

create policy "team_point_history_select_anon"
  on public.team_point_history for select
  to anon, authenticated
  using (true);

-- Optional: allow authenticated writes later, e.g.:
-- create policy "teams_insert_authenticated" on public.teams for insert to authenticated with check (true);
