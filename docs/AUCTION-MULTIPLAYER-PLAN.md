# WC26 Auction — Multiplayer Blind Proxy Plan

Living document for the planned auction redesign: blind proxy bidding, roles, two-player teams, and teammate confirmation. Use this to pick up work **brick by brick** without re-deciding fundamentals.

**Status:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ✅ (blind bids) · Phase 6 ✅ (polish)

> ### Phase 6 — Polish (done)
> - **Auction sounds** — synthesized Web Audio cues (no asset files) for bid-window
>   open, your-bid-confirmed, sold (hammer) and unsold. Persisted mute toggle
>   (`SoundToggle`, `src/lib/sound.ts`). Triggered on `BiddingPanel` state transitions.
> - **Status / empty states** — live pulse + bid-progress bar (`bids in / total teams`)
>   on open lots; squad `X/SQUAD_SIZE` + "Squad full" badge in the watch view.
> - **True blind bidding (optional hardening)** — added a server-only service-role
>   client (`src/lib/supabase/service.ts`). All `bids` reads/writes route through it,
>   so once `SUPABASE_SERVICE_ROLE_KEY` is set the public anon key can no longer peek
>   at live bids. Graceful fallback to the anon client when the key is absent.
>   - **Manual step:** set `SUPABASE_SERVICE_ROLE_KEY` (server env, never `NEXT_PUBLIC_`),
>     then run `supabase/migrations/014_harden_bids_optional.sql`. Do **not** run that
>     migration before setting the key or bidding breaks.

> ### ⚠️ Design revisions (supersede older sections below)
> These decisions were made after the original plan was written. Where the detailed
> sections (7, 9, 12–16) disagree, **these win**:
> 1. **No teammate bid approval.** One teammate submitting a bid is enough — there is no
>    "partner confirms the bid" step. Ignore the `pending_partner` / confirm/reject flow
>    throughout. (Phase 5 is effectively dropped.)
> 2. **No 2/2 requirement to start.** The admin can start the auction at any time. A second
>    teammate can join an existing team **any time, even mid-auction**.
> 3. **Lobby vs Auction Room split.** The **lobby** (`/auction/lobby`) is *only* for team
>    formation (create / join / leave), then you return to the dashboard. The **Auction Room**
>    (dashboard nav → Auction Room tab) is where everyone waits and where the **admin starts
>    and runs** the auction.
> 4. **Teams are created in-app** with a fixed **$200M** budget; old franchises were wiped.

**Related docs:**
- [APP-STRUCTURE.md](./APP-STRUCTURE.md) — current frontend architecture
- [DATABASE.md](./DATABASE.md) — current Supabase schema

---

## Table of contents

1. [Why we're changing](#1-why-were-changing)
2. [Target experience](#2-target-experience)
3. [Auction rules (agreed direction)](#3-auction-rules-agreed-direction)
4. [Roles & permissions](#4-roles--permissions)
5. [User flows](#5-user-flows)
6. [Per-lot lifecycle](#6-per-lot-lifecycle)
7. [Teammate bid confirmation](#7-teammate-bid-confirmation)
8. [Tie-breaking](#8-tie-breaking)
9. [How Supabase helps](#9-how-supabase-helps)
10. [Current system (what exists today)](#10-current-system-what-exists-today)
11. [Gap analysis](#11-gap-analysis)
12. [Proposed data model](#12-proposed-data-model)
13. [Proposed API & realtime](#13-proposed-api--realtime)
14. [Proposed UI surfaces](#14-proposed-ui-surfaces)
15. [Build phases (brick by brick)](#15-build-phases-brick-by-brick)
16. [Open decisions](#16-open-decisions)
17. [File reference (current codebase)](#17-file-reference-current-codebase)

---

## 1. Why we're changing

### Problem with live “shout” bidding + huge pool

- The FIFA player pool is **large** — many lots will be random draws where only 1–2 franchises care.
- Open ascending bids (“12… 13… 14…”) are **slow and awkward** for low-interest lots.
- The current app is a **single shared auctioneer console** — everyone who opens it sees the same controls.

### Proposed solution: blind proxy bidding

- Each interested franchise submits **one secret number** per lot.
- After a bid window closes, the **highest valid bid wins**.
- Fast per lot, works well on phones, reduces anchoring from hearing others bid.

### Problem with current app architecture

| Issue | Today |
|-------|--------|
| No login | Anyone with the URL is everyone |
| No roles | Draw, call-up, and record sale are all public |
| No in-app bidding | Bidding happens by voice; app only records the hammer |
| Same UI for all users | No franchise-specific view, no admin vs manager split |

**Conclusion:** Blind proxy requires a **multiplayer app** (lobby, roles, bids, realtime), not a tweak to the existing single screen.

---

## 2. Target experience

```
Login → Auction lobby
  → Join existing team OR Create team (2 players per team)
  → Admin sees who has joined / who is ready
  → Admin starts auction session
  → Per lot:
      Admin puts player on block → bid window opens
      → Teams submit blind bids (with teammate confirm)
      → Window closes → winner revealed → budget updated
  → Repeat until auction ends
```

### Social format

- **Two managers per franchise team** (couples / co-managers).
- **One admin** (Tejsi) runs the room: draw, timers, start/stop, disputes.
- Everyone on their **own device** (phones/laptops), not one shared laptop.

### Optional hybrid (future)

- **Star / searched players** → longer window or live bidding.
- **Random pool draws** → quick blind one-shot + obvious Pass button.

Not required for v1; blind proxy on all lots is fine if Pass is easy.

---

## 3. Auction rules (agreed direction)

| Rule | Direction |
|------|-----------|
| Bid type | **One sealed bid per team per lot** (blind proxy) |
| Pass | Explicit **Pass** — no bid submitted for that lot |
| Visibility | Teams see **their own** bid status only until lot closes |
| Cross-team | **Never** show other teams' bids before close |
| Budget | Validated server-side at partner confirm **and** at lot close |
| Squad cap | `SQUAD_SIZE` (30) enforced server-side — same as today |
| Winner price | Winning team's bid amount becomes `price_m` on roster |
| Unsold | If all pass → player returns to pool (`available`) or marked unsold |

### Constants (unchanged from app config)

```text
MAX_TEAMS      = 8
SQUAD_SIZE     = 30
DEFAULT_BUDGET = 200M
```

Defined in `src/config/constants.ts`.

---

## 4. Roles & permissions

### Admin (auction host)

- See lobby: teams, who's online, ready state
- **Start / pause / end** auction session
- **Draw random** or **call up** player (host-only)
- **Open / close** bid window per lot
- **Reveal** winner (may be automatic on close)
- Override: void bid, redo lot, manual hammer if dispute
- Configure: timer length, min bid (optional)

### Team member (franchise player)

- See current lot (name, nation, position, points)
- See **own team** budget + squad count
- Submit bid for **own team only**
- Confirm or reject **teammate's** pending bid
- See own team status: drafting / pending partner / confirmed / passed
- After close: see winner + price (not losing teams' amounts)

### Spectator (optional, later)

- Watch lot + result only — no bid controls

### Security note

Today the app uses the **anon key** with broad RLS policies. Multiplayer blind bidding requires either:

- **Authenticated users + tighter RLS**, or
- **Next.js API routes** as gatekeeper (validate role server-side; don't expose other teams' bids to client)

For a friends league, API-route validation is acceptable for v1; tighten RLS in a later phase.

---

## 5. User flows

### 5.1 Login

- Supabase Auth (magic link or Google recommended for friends league)
- Each person gets a stable `auth.users.id`
- Profile row links user → display name, optional `is_admin` flag

### 5.2 Lobby — Create team

1. User chooses **Create team**
2. Enters team name OR claims a pre-created franchise from `teams` table
3. System generates **invite code / link** for partner
4. Creator waits in lobby until partner joins (or admin starts with 1/2 — TBD)

### 5.3 Lobby — Join team

1. User chooses **Join team**
2. Enters invite code OR picks from teams waiting for a partner
3. Bound to that franchise for this **auction session**
4. Max **2 members** per team — reject third join

### 5.4 Admin start gate

Admin sees:

- List of teams and member count (0/1/2)
- Online / ready indicators
- **Start auction** when satisfied (all teams have 2 players? or manual override?)

### 5.5 Admin also on a team?

If admin plays: need **separate admin view** vs team bidding view (second tab, or “switch hat”). Do not mix host controls into the same form as bid submission.

---

## 6. Per-lot lifecycle

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN: Draw random OR call up → player on_block          │
│ 2. ADMIN (or auto): Open bid window (e.g. 60–90 sec)        │
│ 3. TEAMS: Submit bid + teammate confirm, OR Pass            │
│ 4. WINDOW CLOSES (timer or admin)                           │
│ 5. SERVER: Resolve winner (amount, tie-break, budget, squad)│
│ 6. SERVER: Transaction — insert roster, mark pool sold      │
│ 7. ALL CLIENTS: Show "Sold to Team X for $YM" or Unsold     │
│ 8. Next lot                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Lot states (proposed)

| State | Meaning |
|-------|---------|
| `pending` | Player on block, bid window not open yet |
| `open` | Accepting bids |
| `closed` | Window shut, resolving |
| `resolved` | Winner recorded or unsold |
| `void` | Admin cancelled lot |

### Reuse existing pool logic

- `callUpPlayer(fifaId)` — sets `pool_players.auction_status = 'on_block'`
- `sellOnBlockPlayer(teamId, priceM)` — validates budget, inserts `players`, marks `sold`
- New: **`resolveLotFromBids(lotId)`** wraps winner selection + calls same sell logic

---

## 7. Teammate bid confirmation

**Core idea:** When one teammate enters a bid, the other gets a popup:

> “Your teammate has entered $5.0M. Accept this bid?”

Both must agree before the team bid counts as **submitted** for that lot.

### Recommended defaults

| Question | Recommendation |
|----------|----------------|
| Who can type the number? | **Either** teammate |
| Partner rejects | Bid discarded; team can re-enter or Pass |
| Partner never responds | **Timeout** → bid expires; team treated as no bid for that lot (or one retry — TBD) |
| Change after accept? | **No** — locked until lot closes |
| Both submit different amounts? | Prevent with UI: only one **draft** bid per team per lot at a time |

### Bid status flow (per team, per lot)

```text
(none) → draft → pending_partner → confirmed → [locked]
                  ↓ reject/timeout
                discarded → can draft again or pass
```

### Realtime requirement

Partner popup needs **push**, not manual refresh:

- Supabase Realtime on `bids` table, or
- Short polling (~2s) as fallback (feels laggy for confirm UX)

---

## 8. Tie-breaking

When two or more teams submit the same winning amount:

### Recommended default

**Earlier fully-confirmed bid wins** — sort by `amount DESC`, then `confirmed_at ASC`.

- Rewards decisiveness
- No extra round
- Slight advantage to teams ready at keyboard (acceptable for friends league)

### Alternatives

| Method | Pros | Cons |
|--------|------|------|
| Random among tied teams | Feels fair | Arbitrary |
| Second blind round (tied teams only) | Most “competitive” | Slow; painful with huge pool |
| Admin coin flip | Simple | Manual |

### Admin override (optional)

If two friends tie at $12M and complain, admin can run a **30-second tie-break round** between just those two. Not automatic for every tie.

### Edge cases

- **All pass** → unsold, player back to `available`
- **Tie at invalid amount** (over budget) → those bids invalid; next highest wins

---

## 9. How Supabase helps

We are already on Supabase. Today it is used mainly as **Postgres + anon API**. The redesign uses more of the platform:

| Feature | Use in redesign |
|---------|-----------------|
| **PostgreSQL** | Sessions, lots, bids, constraints, tie-break queries, atomic winner transaction |
| **Auth** | Login, user identity, admin flag, team membership |
| **Realtime** | Teammate confirm popup, lobby updates, lot open/close, winner reveal |
| **RLS** | Hide other teams' bids until close (phase 4+) |
| **Migrations** | Same `supabase/migrations/` workflow as existing tables |

### What Supabase does NOT replace

- Split UI (admin / team / lobby screens)
- Teammate confirm modal logic
- Timer UX (client countdown; server `closes_at` is source of truth)
- Business rules (tie-break, pass, min bid)

### Current Supabase clients

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser client (anon key) |
| `src/lib/supabase/server.ts` | Route handlers (anon key + RLS) |

**Not yet used:** Supabase Auth, Realtime subscriptions.

---

## 10. Current system (what exists today)

### 10.1 Product model

- World Cup 2026 fantasy auction dashboard
- Up to **8 franchises**, **30 players** each
- **Total Asset Accumulation Portfolio** scoring (points from FIFA pool)
- Stack: **Next.js 15**, React 19, TypeScript, Tailwind 4, Motion, Supabase

### 10.2 App navigation (`Dashboard.tsx`)

| Tab | Component | Purpose |
|-----|-----------|---------|
| Standings | `PointsTable` | Leaderboard |
| Franchises | `TeamsBoard` → `PlayersPortfolio` | Roster view |
| Auction Room | `AuctionRoom` | Live auction (shared console) |
| Admin | `AdminPage` | Teams, FIFA import, reset |

### 10.3 Current auction flow (single-screen)

```text
Setup phase (AuctionSetup)
  → Add franchises, configure draw nations/rules
  → Admin starts auction (status → in_progress)

In progress (AuctionRoom)
  → Draw random OR Search & call up → one player on_block (global)
  → Bidding happens OUTSIDE the app (voice/chat)
  → Anyone uses SellPlayerForm: pick winner + hammer price
  → Server validates budget + squad cap (sellOnBlockPlayer)
```

**Critical limitation:** Every user sees Draw, Call up, and Record sale. No auth, no roles, no bids table.

### 10.4 Auction phases (today)

| Phase | DB | UI |
|-------|-----|-----|
| `setup` | `auction_settings.status = 'setup'` | `AuctionSetup` |
| `in_progress` | `auction_settings.status = 'in_progress'` | `AuctionRoom` |

Types in `src/types/auction.ts`: `AuctionPhase = 'setup' | 'in_progress'`.

### 10.5 Pool player statuses

| Status | Meaning |
|--------|---------|
| `available` | In pool, not auctioned |
| `on_block` | Current lot |
| `sold` | Assigned to a franchise |

### 10.6 Draw settings

- `draw_countries` — nation filter for random draw
- `draw_rules` — per nation: `{ mode: 'whole' }` or `{ mode: 'pick', playerIds: [...] }`
- Search/call-up can pull **any** player regardless of draw nations

### 10.7 API routes (auction & pool)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auction/status` | GET | Phase + draw settings |
| `/api/auction/start` | POST | Start auction |
| `/api/auction/draw` | POST | Random draw → on_block |
| `/api/auction/call-up` | POST | Named player → on_block |
| `/api/auction/on-block` | GET | Current lot |
| `/api/auction/sell` | POST | Record sale (manual hammer) |
| `/api/auction/reset` | POST | Full auction reset |
| `/api/auction/draw-settings` | GET/PATCH | Nation filter rules |
| `/api/auction/recent-sales` | GET | Sale feed |
| `/api/pool/stats` | GET | available / on_block / sold counts |
| `/api/pool/search` | GET | Player name search |
| `/api/pool/nations` | GET | Nations in pool |
| `/api/pool/players` | GET | Players by country |
| `/api/fifa/import` | POST | Import FIFA pool (admin) |
| `/api/fifa/sync-points` | POST | Sync fantasy points |

### 10.8 Core server logic

**`src/lib/db/auction-repository.ts`** — main auction backend:

| Function | Role |
|----------|------|
| `getAuctionState()` | Phase + draw settings |
| `startAuction(teamCount)` | Validates pool, sets in_progress |
| `drawRandomPlayer(settings)` | Random eligible → `callUpPlayer` |
| `callUpPlayer(fifaId)` | Sets on_block |
| `searchPoolPlayers(query)` | Name search |
| `sellOnBlockPlayer(teamId, priceM)` | Budget/squad check, insert roster, mark sold |
| `resetAuction()` | Clears rosters, pool, settings |
| `getRecentSales()` | Sold feed |

**Budget validation** (reuse for bid confirm + lot resolve):

```text
remaining = budget_total - sum(players.price_m)
reject if priceM > remaining or squadCount >= SQUAD_SIZE
```

Same logic in `getTeamAuctionState()` inside `auction-repository.ts` and `getBudgetRemainingM()` in `src/lib/budget.ts`.

### 10.9 Database tables (today)

| Table | Purpose |
|-------|---------|
| `teams` | Franchises (name, budget, points) |
| `players` | Roster slots per team |
| `team_point_history` | Standings sparklines |
| `pool_players` | Full FIFA import pool |
| `auction_settings` | Single row: phase, draw config, started_at |

Migrations: `001` → `009` in `supabase/migrations/`.

### 10.10 Security (today)

- RLS enabled; mostly **open read** + **anon write** for trusted friends setup
- No Supabase Auth in app
- Service role key **not** in frontend (correct)

---

## 11. Gap analysis

| Capability | Today | Needed |
|------------|-------|--------|
| User login | ❌ | Supabase Auth |
| Team membership (2 users) | ❌ | `session_members` or similar |
| Auction session / lobby | ❌ | `auction_sessions` |
| In-app bids | ❌ | `bids` + API |
| Teammate confirm | ❌ | Bid status + Realtime |
| Role-based UI | ❌ | Admin vs team views |
| Bid window timer | ❌ | `lots.opens_at` / `closes_at` |
| Auto winner resolution | ❌ | `resolveLotFromBids()` |
| Hide other teams' bids | ❌ | RLS or API filtering |
| Realtime | ❌ | Supabase Realtime |

### What we keep

- FIFA pool import and `pool_players`
- Draw rules and nation filter (admin-side)
- `sellOnBlockPlayer` validation logic
- Budget display, recently sold, standings
- Visual design / FIFA components

### What we restrict or replace

- Public **Draw / Call up / Sell** on `AuctionRoom` → **admin only**
- Manual hammer form → **bid resolution** (admin can still override)
- Single `AuctionRoom` → **lobby + admin console + team bid view**

---

## 12. Proposed data model

New tables (names tentative — finalize in Phase 1 migration):

### `profiles`

```text
id              uuid PK → auth.users.id
display_name    text
is_admin        boolean default false
created_at      timestamptz
```

### `auction_sessions`

```text
id              uuid PK
status          text  -- lobby | live | paused | ended
created_by      uuid → profiles.id
started_at      timestamptz
ended_at        timestamptz
settings        jsonb  -- default bid window seconds, etc.
```

### `session_teams`

Links franchises to a session (may reuse `teams.id`):

```text
id              uuid PK
session_id      uuid FK → auction_sessions
team_id         uuid FK → teams
invite_code     text unique
slot1_user_id   uuid nullable → profiles
slot2_user_id   uuid nullable → profiles
ready           boolean default false
joined_at       timestamptz
```

Constraint: at most 2 distinct user IDs per `session_teams` row.

### `lots`

One row per player put up for bid:

```text
id              uuid PK
session_id      uuid FK
fifa_id         int FK → pool_players
status          text  -- pending | open | closed | resolved | void
opened_at       timestamptz
closes_at       timestamptz
winning_team_id uuid nullable FK → teams
winning_amount  numeric nullable
resolved_at     timestamptz
```

### `bids`

```text
id              uuid PK
lot_id          uuid FK → lots
session_team_id uuid FK → session_teams
amount          numeric nullable  -- null = pass
status          text  -- draft | pending_partner | confirmed | rejected | expired
drafted_by      uuid → profiles
confirmed_by    uuid nullable → profiles
confirmed_at    timestamptz nullable
created_at      timestamptz
updated_at      timestamptz
```

Unique constraint: **one confirmed bid (or pass) per session_team per lot**.

### Session vs global `auction_settings`

- Option A: Keep `auction_settings` for draw pool config; add `auction_sessions` for live multiplayer night.
- Option B: Move draw config onto session row.

**Recommendation:** Option A for minimal disruption — global draw rules, per-session lobby/live state.

---

## 13. Proposed API & realtime

### New API routes (sketch)

| Route | Purpose |
|-------|---------|
| `POST /api/auth/...` | Supabase Auth callbacks (if needed) |
| `GET /api/session/current` | Active session + user's team |
| `POST /api/session/create` | Create team + invite code |
| `POST /api/session/join` | Join team by code |
| `POST /api/session/ready` | Mark team ready |
| `POST /api/session/start` | Admin only — lobby → live |
| `POST /api/lots/open` | Admin — new lot + open window |
| `POST /api/lots/close` | Admin or cron — close early |
| `POST /api/bids/draft` | Team member submits amount |
| `POST /api/bids/confirm` | Partner accept |
| `POST /api/bids/reject` | Partner reject |
| `POST /api/bids/pass` | Team passes on lot |
| `GET /api/lots/current` | Current lot + **own** bid status |
| `POST /api/lots/resolve` | Server winner logic (or internal only) |

Existing routes stay for admin: draw, call-up, pool search, FIFA import.

### Realtime channels (Supabase)

Subscribe by `session_id`:

| Table / event | Subscribers |
|---------------|-------------|
| `session_teams` INSERT/UPDATE | Admin lobby |
| `lots` UPDATE | All — new lot, window open/close |
| `bids` UPDATE (filtered) | Teammates on same team |
| Lot resolved | All — show winner |

---

## 14. Proposed UI surfaces

### `/auction/lobby`

- Not logged in → login
- Logged in, no team → **Create team** | **Join team**
- Waiting → show partner status, invite link, Ready button

### `/auction/admin` (admin only)

- Team roster (2/2 filled?, online?)
- Start session
- Draw / call up
- Open & close lot, timer
- Override tools

### `/auction/play` (team members)

- Current player on block
- Own budget + squad
- Bid input + Pass
- Pending partner modal
- Status: “Waiting for partner” / “Bid locked $X” / “You passed”
- After close: winner banner

### Existing tabs

- Standings, Franchises — unchanged
- Old `AuctionRoom` → gradually replaced or role-routed

---

## 15. Build phases (brick by brick)

Work in order. Each phase should be **demoable** before the next.

### Phase 1 — Auth & identity ✅ DONE

- [x] Supabase Auth (email + password; magic link optional)
- [x] `profiles` table + admin flag (`auction_admin_emails` allowlist)
- [x] Protected routes: `/auction/*` → `/login`
- [x] Admin tab on dashboard: **visible only when `profile.isAdmin`**
- [x] **Done:** users sign in, see lobby, admin sees Admin tab

### Phase 2 — Session lobby (no bidding yet) ✅ DONE

Decisions made: teams **created fresh** in lobby (fixed **$200M**), teammate joins from a
**list of open teams**, admin **also plays**, **strict** start (all teams 2/2, ≥2 teams),
**single** auto-created session, **old franchises wiped**.

- [x] `auction_sessions` (single row) + `team_members` tables (`011_session_lobby.sql`)
- [x] Create team (name; budget fixed $200M) → creates a real `teams` row
- [x] Join team from list of open teams (max 2 via slots)
- [x] Leave team (empty team auto-deleted)
- [x] Admin lobby view: all teams + who joined + ready count
- [x] Admin "Start session" + "Reopen lobby" reset — **start lives in the Auction Room, not the lobby; no 2/2 gate**
- [x] Nav bar on auth pages + sign-out redirects to `/login` (no dead-end)
- [x] Lobby polls every ~3.5s for live updates
- [x] **Done:** group can create/join teams and admin can start

**Manual setup:** run `supabase/migrations/011_session_lobby.sql` in Supabase SQL Editor.
⚠️ This wipes existing `teams`/`players`/`team_point_history`.

**New routes:** `/api/session/state`, `/api/session/team/{create,join,leave}`,
`/api/session/{start,reset}`

**Implementation notes / deviations from original plan:**
- Used `team_members` (slot 1/2) instead of `session_teams.slot1/slot2_user_id` columns —
  cleaner max-2 enforcement via `unique(team_id, slot)` + `unique(user_id)`.
- Teams created in lobby are real `teams` rows (so Phase 4 sell logic + standings reuse them).
- Lobby uses **polling**, not Realtime yet (Realtime deferred to a later phase).
- RLS permissive for authenticated; server routes enforce rules (harden in Phase 6).
- Added `profiles_select_authenticated` so teammates' display names are visible.

### Phase 3 — Role-split auction shell ✅ DONE

- [x] Admin: full console (draw / search / call-up / sell / add nations mid-auction)
- [x] Team view: read-only watch (`AuctionWatch`) — on-block player, own budget+squad, all budgets, recently sold
- [x] Server-side admin guard (`requireAdmin`) on draw, call-up, sell, start, reset, draw-settings PUT
- [x] **Unified start:** the admin's existing "Save & start auction" (nations → start) now also flips the session **live**, so player screens activate. Reset returns session to **lobby**.
- [x] **"Skipped" status:** a player bumped off the block without a sale is set aside (`auction_status = 'skipped'`) so the random draw won't re-surface them; admin can still search + call them up.
- [x] **Done:** host runs lots, players watch live on their own screens

**Manual setup:** run `supabase/migrations/012_skipped_status.sql` (adds `skipped` to the
`auction_status` check constraint).

**Edge cases handled:**
- Random draw only pulls `available` → on-block, sold, **and skipped** players are excluded.
- Re-importing the FIFA pool preserves `sold` / `on_block` / `skipped` statuses.
- Reset returns `sold` / `on_block` / `skipped` all back to `available`.
- Auction Room requires login; non-admins can't hit the mutating APIs even directly.

**New/changed:** `AuctionWatch`, `AuctionRoomSection` (player branch), `requireAdmin`,
guarded auction routes, `auction-repository` skip logic, migration `012`.

### Phase 4 — Blind bids (single operator per team)

- [x] `lots` + `bids` tables (`013_blind_bids.sql`) — one bid row per team per lot
- [x] Admin opens/closes the bid window manually (`/api/auction/lot/{open,close,cancel}`)
- [x] Submit bid + Pass — **either teammate, editable until close, no approval step** (`/api/auction/bid`)
- [x] Blind while open (API never returns other teams' amounts); **reveal all on close**
- [x] Server resolves highest **valid** bid (budget + squad re-checked), reuses `sellOnBlockPlayer`
- [x] Tie-break: earlier submitted bid (`amount DESC, created_at ASC`)
- [x] No valid bid → player **set aside (skipped)**
- [x] Shared `BiddingPanel` — player watch + admin console; manual sell form kept as override
- [x] **Done:** full lot cycle works end to end (any one teammate operates)

**Manual setup:** run `supabase/migrations/013_blind_bids.sql` in the Supabase SQL Editor.

**How a lot resolves:** valid bids sorted high→low (ties: earliest); first team that can
still afford it with squad room wins; `sellOnBlockPlayer` records the roster + marks pool sold.
Switching the on-block player (draw/call-up) auto-voids any open lot.

**New routes:** `/api/auction/lot/{current,open,close,cancel}`, `/api/auction/bid`.

### Phase 5 — ~~Teammate confirmation~~ → Realtime polish (DROPPED confirm)

Teammate bid approval is **removed** by design. This phase is now just optional Realtime
upgrades (replace lobby/auction polling with live subscriptions).

- [ ] Realtime for lobby + lot open/close + winner reveal (replaces polling)

### Phase 6 — Polish & hardening

- [ ] Timers, sounds, clear empty states
- [ ] Tighter RLS on bids
- [ ] Admin tie-break round (optional)
- [ ] Offline / solo teammate policy
- [ ] **Done when:** ready for auction night

---

## 16. Open decisions

Track answers here as you decide:

| # | Question | Options | Decision |
|---|----------|---------|----------|
| 1 | Start requires all teams at 2/2? | Strict vs admin override | **No gate — admin starts anytime** |
| 2 | Partner confirm timeout | 30s / 60s / until lot closes | **N/A — confirm removed** |
| 3 | Reject → allow re-bid same lot? | Yes once / unlimited until close | **N/A — confirm removed** |
| 4 | Create team vs claim admin franchise | New row vs pick existing `teams` | **Create fresh team ($200M); old teams wiped** |
| 5 | Default bid window length | 60s / 90s / configurable | _TBD_ |
| 6 | Show losing bid amounts after close? | Yes / no (keep next lot blind) | _TBD_ |
| 7 | Min bid / increment | None / $0.5M steps | _TBD_ |
| 8 | All pass → player fate | Back to pool immediately | _TBD_ |
| 9 | Auth method | Magic link / Google / PIN | _TBD_ |
| 10 | Admin plays too | Second tab / co-host | _TBD_ |

---

## 17. File reference (current codebase)

### Auction UI

| File | Role |
|------|------|
| `src/components/AuctionRoom.tsx` | Main live auction page |
| `src/components/auction/AuctionSetup.tsx` | Pre-start setup |
| `src/components/auction/SellPlayerForm.tsx` | Manual hammer (to replace) |
| `src/components/auction/PlayerSearch.tsx` | Call up by name |
| `src/components/auction/DrawRulesPanel.tsx` | Nation draw filter |
| `src/components/auction/FranchisePicker.tsx` | Team dropdown for sell |
| `src/components/auction/RecentlySold.tsx` | Sale feed |

### Admin

| File | Role |
|------|------|
| `src/components/admin/AdminPage.tsx` | Admin shell |
| `src/components/admin/AddTeamForm.tsx` | Add franchise |
| `src/components/admin/TeamAdminList.tsx` | Edit/delete teams |
| `src/components/admin/ImportFifaPool.tsx` | FIFA import |
| `src/components/admin/ResetAuction.tsx` | Full reset |

### Data layer

| File | Role |
|------|------|
| `src/lib/db/auction-repository.ts` | Auction business logic |
| `src/lib/db/league-repository.ts` | Standings fetch |
| `src/lib/db/teams-repository.ts` | Team CRUD |
| `src/lib/db/pool-repository.ts` | Pool stats |
| `src/lib/budget.ts` | Remaining budget calc |

### Types

| File | Role |
|------|------|
| `src/types/auction.ts` | Pool, phase, draw types |
| `src/types.ts` | Manager, Player, Position |
| `src/config/constants.ts` | SQUAD_SIZE, budgets |

### Supabase

| File | Role |
|------|------|
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/server.ts` | Server client |
| `supabase/migrations/*.sql` | Schema history |

### Migrations (run in order)

```text
001_initial_schema.sql      — teams, players, history
002_teams_admin_insert.sql
003_pool_players_fifa.sql   — pool_players
004_auction_draw.sql        — auction_settings, on_block
005_players_insert.sql
006_players_squad_id.sql
007_auction_lifecycle.sql   — status, draw_rules
008_teams_update_delete.sql
009_reset_auction_policies.sql
010_profiles_auth.sql   — profiles, admin emails, auth trigger
011_session_lobby.sql   — auction_sessions, team_members (wipes old teams)
```

---

## Quick recap

| Topic | Plan |
|-------|------|
| Bidding | Blind proxy — one sealed bid per team per lot |
| Teams | 2 players per franchise; create or join in lobby |
| Confirm | Partner must accept before bid counts |
| Admin | Host starts session, runs draw, opens/closes lots |
| Tie-break | Earlier confirmed bid wins; optional admin tie round |
| Stack | Keep Next.js + Supabase; add Auth + Realtime |
| Build | 6 phases — auth → lobby → roles → bids → confirm → polish |

When ready to build, start with **Phase 1** and check items off in Section 15.
