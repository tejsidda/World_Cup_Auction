'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Crown,
  Loader2,
  LogIn,
  Plus,
  UserPlus,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import type { SessionState } from '@/types/session';

const POLL_INTERVAL_MS = 3500;

export function LobbyView() {
  const [state, setState] = useState<SessionState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState('');
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/session/state', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load lobby');
      setState(data.state);
      setLoadError(null);
    } catch (err) {
      if (firstLoad.current) {
        setLoadError(err instanceof Error ? err.message : 'Could not load lobby');
      }
    } finally {
      firstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function act(url: string, body?: unknown) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      await load();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const ok = await act('/api/session/team/create', { name: teamName });
    if (ok) setTeamName('');
  }

  if (loadError) {
    return (
      <div className="fifa-card rounded-sm p-6 border border-red-500/20 bg-red-500/5 text-[13px] text-red-400">
        {loadError}
        <button onClick={() => load()} className="ml-3 underline text-white/70">
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-[#666] text-[14px] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading lobby…
      </div>
    );
  }

  const myTeam = state.teams.find((t) => t.id === state.myTeamId) ?? null;
  const openTeams = state.teams.filter((t) => !t.full && t.id !== state.myTeamId);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="WC26 · Lobby"
        title="Auction lobby"
        subtitle="Create a team or join a teammate, then head to the Auction Room."
        icon={<Users className="w-4 h-4" />}
      />

      {state.status === 'live' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 fifa-card rounded-sm p-5 border-[#00A94F]/30 bg-[#00A94F]/[0.04]">
          <p className="text-[14px] text-white/85">
            The auction is <span className="text-[#00A94F] font-semibold">live</span>. Head to the
            Auction Room to follow along.
          </p>
          <Link
            href="/?view=auction"
            className="inline-flex items-center gap-2 text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-sm bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F] hover:bg-[#00A94F]/25"
          >
            Auction Room <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {actionError && (
        <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
          {actionError}
        </p>
      )}

      {/* My team / create-join */}
      {myTeam ? (
        <div className="fifa-card rounded-sm p-6 border-[#00A94F]/25 space-y-4">
          <div className="flex items-center justify-between">
            <span className="fifa-stat-label">Your team</span>
            <span
              className={cn(
                'text-[11px] font-display font-semibold uppercase tracking-wide px-2.5 py-1 rounded-sm border',
                myTeam.full
                  ? 'bg-[#00A94F]/10 border-[#00A94F]/25 text-[#00A94F]'
                  : 'bg-white/[0.04] border-white/[0.1] text-white/50'
              )}
            >
              {myTeam.members.length}/2 players
            </span>
          </div>
          <p className="text-[24px] fifa-headline text-white">{myTeam.name}</p>

          <div className="flex flex-col gap-2">
            {myTeam.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-2 text-[14px] text-white/85 bg-black/40 border border-white/[0.06] rounded-sm px-3 py-2"
              >
                <Check className="w-3.5 h-3.5 text-[#00A94F]" />
                {m.displayName}
                {m.userId === myTeam.createdBy && (
                  <Crown className="w-3 h-3 text-[#E5A93D]" aria-label="Creator" />
                )}
              </div>
            ))}
            {!myTeam.full && (
              <div className="flex items-center gap-2 text-[13px] text-[#888] border border-dashed border-white/[0.12] rounded-sm px-3 py-2">
                <UserPlus className="w-3.5 h-3.5" />
                Open slot — a teammate can join any time (even mid-auction).
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/?view=auction"
              className="inline-flex items-center gap-2 text-[13px] font-display font-semibold uppercase tracking-wide px-5 py-2.5 rounded-sm bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F] hover:bg-[#00A94F]/25"
            >
              Go to Auction Room <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => act('/api/session/team/leave')}
              className="text-[12px] text-white/45 hover:text-red-400 transition-colors"
            >
              Leave team
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create */}
          <form
            onSubmit={handleCreate}
            className="fifa-card rounded-sm p-6 border-[#00A94F]/25 space-y-4"
          >
            <span className="fifa-stat-label flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-[#00A94F]" /> Create a team
            </span>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
              maxLength={40}
              disabled={busy}
              className="w-full bg-black/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#00A94F]/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !teamName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-sm text-[13px] font-display font-semibold uppercase tracking-wide bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F] hover:bg-[#00A94F]/25 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create team
            </button>
            <p className="text-[12px] text-[#666]">Budget is $200M for every team.</p>
          </form>

          {/* Join */}
          <div className="fifa-card rounded-sm p-6 border border-white/[0.08] space-y-4">
            <span className="fifa-stat-label flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-[#E5A93D]" /> Join a team
            </span>
            {openTeams.length === 0 ? (
              <p className="text-[13px] text-[#666]">
                No open teams yet. Create one, or wait for someone else to.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                {openTeams.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 bg-black/40 border border-white/[0.06] rounded-sm px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] text-white truncate">{t.name}</p>
                      <p className="text-[11px] text-[#666]">
                        {t.members[0]?.displayName ?? 'Open'} · needs 1
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act('/api/session/team/join', { teamId: t.id })}
                      className="shrink-0 flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Join
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* All teams overview */}
      <div className="fifa-card rounded-sm p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <span className="fifa-stat-label">Teams in lobby</span>
          <span className="text-[12px] text-[#666]">
            {state.teams.length} team{state.teams.length === 1 ? '' : 's'}
          </span>
        </div>
        {state.teams.length === 0 ? (
          <p className="text-[13px] text-[#666]">No teams yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {state.teams.map((t) => (
              <div
                key={t.id}
                className={cn(
                  'rounded-sm border px-3 py-2.5',
                  t.full
                    ? 'border-[#00A94F]/25 bg-[#00A94F]/[0.04]'
                    : 'border-white/[0.06] bg-black/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[14px] text-white truncate">{t.name}</p>
                  <span
                    className={cn(
                      'text-[11px] font-mono',
                      t.full ? 'text-[#00A94F]' : 'text-white/40'
                    )}
                  >
                    {t.members.length}/2
                  </span>
                </div>
                <p className="text-[11px] text-[#666] truncate">
                  {t.members.map((m) => m.displayName).join(' & ') || '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
