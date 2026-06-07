-- Phase 6 hardening (OPTIONAL) — true blind bidding at the database level.
--
-- Background: the public anon key can currently read the `bids` table, so a
-- technical user could peek at other teams' live bids. The app enforces
-- blindness in the API, but this closes the gap at the DB.
--
-- ⚠️ Run this ONLY AFTER setting SUPABASE_SERVICE_ROLE_KEY in your server env
-- (e.g. .env.local / Vercel). With the key set, the server reads & writes bids
-- using the service role, which bypasses RLS. Without it, the app falls back to
-- the anon client and still needs the permissive policies — so don't run this
-- until the key is configured, or bidding will break.

drop policy if exists "bids_select" on public.bids;
drop policy if exists "bids_write" on public.bids;

-- RLS stays enabled with no policies => anon/authenticated clients get zero rows.
-- The service role bypasses RLS, so server-side bidding keeps working.
