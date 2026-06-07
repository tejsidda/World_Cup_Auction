-- Link roster players to FIFA squad id for jersey assets
alter table public.players
  add column if not exists squad_id integer;

-- Backfill from pool for players sold before this migration
update public.players p
set squad_id = pp.squad_id
from public.pool_players pp
where p.fifa_id = pp.fifa_id
  and p.squad_id is null;
