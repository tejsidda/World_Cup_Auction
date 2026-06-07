-- Auction draw: on_block status + draw nation settings
-- Run after 003_pool_players_fifa.sql

alter table public.pool_players
  drop constraint if exists pool_players_auction_status_check;

alter table public.pool_players
  add constraint pool_players_auction_status_check
  check (auction_status in ('available', 'on_block', 'sold'));

create index pool_players_country_abbr_idx on public.pool_players (country_abbr);

-- Single-row settings for draw nation filter (shared across devices)
create table public.auction_settings (
  id smallint primary key default 1 check (id = 1),
  draw_countries text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.auction_settings (id, draw_countries)
values (1, '{}')
on conflict (id) do nothing;

create trigger auction_settings_updated_at
  before update on public.auction_settings
  for each row execute function public.set_updated_at();

alter table public.auction_settings enable row level security;

create policy "auction_settings_select_anon"
  on public.auction_settings for select
  to anon, authenticated
  using (true);

create policy "auction_settings_update_anon"
  on public.auction_settings for update
  to anon, authenticated
  using (true)
  with check (true);

-- Allow deleting roster rows on auction reset
create policy "players_delete_anon"
  on public.players for delete
  to anon, authenticated
  using (true);
