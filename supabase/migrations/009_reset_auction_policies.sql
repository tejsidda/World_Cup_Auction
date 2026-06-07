-- Policies needed for a full auction reset (roster + standings history)
-- Run after 004_auction_draw.sql and 008_teams_update_delete.sql

create policy "team_point_history_delete_anon"
  on public.team_point_history for delete
  to anon, authenticated
  using (true);
