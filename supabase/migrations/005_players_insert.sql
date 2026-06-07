-- Allow inserting roster players when marking auction lots sold
create policy "players_insert_anon"
  on public.players for insert
  to anon, authenticated
  with check (true);
