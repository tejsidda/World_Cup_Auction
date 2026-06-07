-- Phase 4: blind bidding — lots + bids
-- One "lot" = one player opened for blind bids. Each team submits one bid
-- (editable until close). On close the server resolves the highest valid bid.

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  fifa_id integer not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'void')),
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  winning_team_id uuid references public.teams (id) on delete set null,
  winning_amount numeric(10, 2),
  created_at timestamptz not null default now()
);

create index lots_status_idx on public.lots (status);
create index lots_created_idx on public.lots (created_at desc);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  amount numeric(10, 2),            -- null = pass
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lot_id, team_id)
);

create index bids_lot_idx on public.bids (lot_id);

create trigger bids_updated_at
  before update on public.bids
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — permissive for the friends app; the API layer enforces blindness
-- (other teams' bid amounts are never returned while a lot is open) and the
-- admin-only open/close. Hardened further in Phase 6.
-- ---------------------------------------------------------------------------
alter table public.lots enable row level security;

create policy "lots_select"
  on public.lots for select
  to anon, authenticated
  using (true);

create policy "lots_write"
  on public.lots for all
  to anon, authenticated
  using (true)
  with check (true);

alter table public.bids enable row level security;

create policy "bids_select"
  on public.bids for select
  to anon, authenticated
  using (true);

create policy "bids_write"
  on public.bids for all
  to authenticated
  using (true)
  with check (true);
