-- Auth profiles for multiplayer auction (Phase 1)
-- Run after 009_reset_auction_policies.sql
--
-- BEFORE using login:
-- 1. Supabase Dashboard → Authentication → Providers → enable Email
-- 2. Authentication → URL Configuration → add redirect: http://localhost:3000/auth/callback
--    (and your production URL when deployed)
-- 3. Optional: insert your admin email below

-- ---------------------------------------------------------------------------
-- Admin allowlist (populated manually in SQL Editor)
-- ---------------------------------------------------------------------------
create table public.auction_admin_emails (
  email text primary key
);

comment on table public.auction_admin_emails is
  'Emails listed here receive is_admin=true on signup. Example: insert into auction_admin_emails (email) values (''you@example.com'');';

-- Lock down: only SQL Editor (postgres) and the signup trigger may read this.
-- No policies = anon/authenticated clients cannot select/insert/update/delete.
alter table public.auction_admin_emails enable row level security;

-- ---------------------------------------------------------------------------
-- User profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Fallback if trigger did not run (e.g. user predates migration)
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and is_admin = false);

-- Users may update display_name only; is_admin cannot be self-promoted
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_match boolean;
  name text;
begin
  name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  select exists (
    select 1 from public.auction_admin_emails where email = lower(new.email)
  ) into admin_match;

  insert into public.profiles (id, email, display_name, is_admin)
  values (new.id, lower(new.email), name, coalesce(admin_match, false));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
