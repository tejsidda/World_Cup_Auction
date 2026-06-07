-- Auction lifecycle: setup vs in_progress, per-nation player draw rules
-- Run after 004_auction_draw.sql

alter table public.auction_settings
  add column if not exists status text not null default 'setup'
    check (status in ('setup', 'in_progress')),
  add column if not exists started_at timestamptz,
  add column if not exists draw_rules jsonb not null default '{}';
