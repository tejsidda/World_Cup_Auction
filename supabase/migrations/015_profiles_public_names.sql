-- Phase 6 follow-up — show team member names on the dashboard.
--
-- The dashboard league/franchise data is fetched with the public anon key (no
-- auth session), so the team_members -> profiles(display_name) join was blocked
-- by RLS. This lets anon read ONLY display names (used for member lists), while
-- email / is_admin stay protected via column-level grants.

-- Restrict the anon role to just the public columns, then allow the read.
revoke select on public.profiles from anon;
grant select (id, display_name) on public.profiles to anon;

drop policy if exists "profiles_select_display_anon" on public.profiles;
create policy "profiles_select_display_anon"
  on public.profiles for select
  to anon
  using (true);
