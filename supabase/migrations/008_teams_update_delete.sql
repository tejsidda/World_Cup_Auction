-- Allow admin UI to update and delete teams via anon key
-- Run after 002_teams_admin_insert.sql

create policy "teams_update_anon"
  on public.teams for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "teams_delete_anon"
  on public.teams for delete
  to anon, authenticated
  using (true);
