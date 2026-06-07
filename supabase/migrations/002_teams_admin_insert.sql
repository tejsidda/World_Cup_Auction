-- Allow admin UI to insert teams via anon key
-- Run in Supabase SQL Editor after 001_initial_schema.sql

create policy "teams_insert_anon"
  on public.teams for insert
  to anon, authenticated
  with check (true);
