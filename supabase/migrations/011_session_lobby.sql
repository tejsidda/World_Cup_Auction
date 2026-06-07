-- Phase 2: Session lobby — teams created in-app, two players per team
-- Run after 010_profiles_auth.sql
--
-- NOTE: This WIPES existing franchises/rosters (per Phase 2 decision: auction
-- uses freshly-created teams). The Standings/Franchises tabs will be empty until
-- teams are created in the lobby.

-- ---------------------------------------------------------------------------
-- Wipe old league data (auction creates fresh teams)
-- ---------------------------------------------------------------------------
delete from public.players;
delete from public.team_point_history;
delete from public.teams;

-- ---------------------------------------------------------------------------
-- Track who created a team (lobby franchises)
-- ---------------------------------------------------------------------------
alter table public.teams
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Single auction session (lobby → live → ended)
-- ---------------------------------------------------------------------------
create table public.auction_sessions (
  id smallint primary key default 1 check (id = 1),
  status text not null default 'lobby' check (status in ('lobby', 'live', 'ended')),
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.auction_sessions (id, status)
values (1, 'lobby')
on conflict (id) do nothing;

create trigger auction_sessions_updated_at
  before update on public.auction_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Team membership — max 2 per team (slots 1 & 2), one team per user
-- ---------------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  slot smallint not null check (slot in (1, 2)),
  joined_at timestamptz not null default now(),
  unique (user_id),
  unique (team_id, slot)
);

create index team_members_team_idx on public.team_members (team_id);

-- ---------------------------------------------------------------------------
-- RLS — permissive for authenticated; server routes enforce the real rules.
-- (Hardened further in a later phase.)
-- ---------------------------------------------------------------------------
alter table public.auction_sessions enable row level security;

create policy "auction_sessions_select"
  on public.auction_sessions for select
  to anon, authenticated
  using (true);

create policy "auction_sessions_update"
  on public.auction_sessions for update
  to authenticated
  using (true)
  with check (true);

alter table public.team_members enable row level security;

create policy "team_members_select"
  on public.team_members for select
  to anon, authenticated
  using (true);

create policy "team_members_insert"
  on public.team_members for insert
  to authenticated
  with check (true);

create policy "team_members_delete"
  on public.team_members for delete
  to authenticated
  using (true);

-- Allow signed-in users to see each other's display names (teammates, rosters).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);
