# World Cup 2026 Fantasy Auction

Interactive dashboard for an 8-team custom draft league. Built with **Next.js** and **Supabase**, deployable on **Vercel**.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/001_initial_schema.sql` in **SQL Editor**.
3. Run `supabase/migrations/002_teams_admin_insert.sql` for Admin → Add team.
4. Run `supabase/migrations/003_pool_players_fifa.sql` for FIFA pool import + points sync.
5. Run `supabase/migrations/004_auction_draw.sql` for draw nations, search, and reset.
6. Copy **Project URL** and **anon public** key from **Project Settings → API**.

## 2. Environment

Copy `.env.local.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Use the **anon public** key only — never `service_role` in the browser.

On **Vercel**, add the same variables under Project → Settings → Environment Variables.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Deploy on Vercel

1. Push the repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import repository.
3. Framework preset: **Next.js** (auto-detected).
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Deploy.

No extra config required — `next.config.ts` is included.

## Documentation

- [docs/APP-STRUCTURE.md](docs/APP-STRUCTURE.md) — App architecture
- [docs/DATABASE.md](docs/DATABASE.md) — Supabase schema

## FIFA sync

| When | Action |
|------|--------|
| Pre-auction | **Admin → Import FIFA player pool** (~1,480 players into `pool_players`) |
| During WC | **Refresh Standings** — pulls `stats.totalPoints` from FIFA for roster players linked by `fifa_id` |

FIFA sources: [squads.json](https://play.fifa.com/json/fantasy/squads.json), [players.json](https://play.fifa.com/json/fantasy/players.json)

## Adding league data

Use **Admin** in the app to add teams, or Supabase Table Editor — see [docs/DATABASE.md](docs/DATABASE.md).

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | TypeScript check |

## Project structure

```
app/                  Next.js App Router (layout, page, globals.css)
src/components/       UI (Dashboard, tables, auction, admin)
src/lib/              Supabase client, repositories, mappers
src/hooks/            useLeague
supabase/migrations/  SQL schema
```
