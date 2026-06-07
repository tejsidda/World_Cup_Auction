-- Phase 3: "skipped" auction status
-- A player who was on the block but moved past without a sale is set aside
-- (status = 'skipped') so the random draw won't surface them again. The admin
-- can still search and call them up manually.

alter table public.pool_players
  drop constraint if exists pool_players_auction_status_check;

alter table public.pool_players
  add constraint pool_players_auction_status_check
  check (auction_status in ('available', 'on_block', 'sold', 'skipped'));
