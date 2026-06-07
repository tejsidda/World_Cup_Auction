'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Radio,
  Gavel,
  Loader2,
  Lock,
  Play,
  X,
  Check,
  Trophy,
  Ban,
} from 'lucide-react';
import type { CurrentLotState } from '@/types/auction';
import { SquadFlag } from '@/components/fifa/SquadFlag';
import { notifySaleRecorded } from '@/components/auction/RecentlySold';
import { SoundToggle } from '@/components/auction/SoundToggle';
import { playOpen, playBid, playSold, playUnsold } from '@/lib/sound';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 2500;

interface BiddingPanelProps {
  isAdmin: boolean;
  totalTeams: number;
  showPlayerCard?: boolean;
  onResolved?: () => void;
}

export function BiddingPanel({
  isAdmin,
  totalTeams,
  showPlayerCard = true,
  onResolved,
}: BiddingPanelProps) {
  const [state, setState] = useState<CurrentLotState | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bidInput, setBidInput] = useState('');
  const firstLoad = useRef(true);
  const lastResolvedLot = useRef<string | null>(null);
  const lastOpenLot = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/auction/lot/current', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        const next: CurrentLotState = data.state;
        setState(next);
        setTeamId(data.teamId ?? null);

        // Sound: a bid window newly opened.
        if (next.status === 'open' && next.lotId && lastOpenLot.current !== next.lotId) {
          lastOpenLot.current = next.lotId;
          if (!firstLoad.current) playOpen();
        }

        // Fire onResolved + sound once when a lot newly resolves.
        if (next.status === 'resolved' && next.lotId && lastResolvedLot.current !== next.lotId) {
          lastResolvedLot.current = next.lotId;
          if (!firstLoad.current) {
            notifySaleRecorded();
            onResolved?.();
            if (next.result?.sold) playSold();
            else playUnsold();
          }
        }
      }
    } catch {
      // keep last known state
    } finally {
      firstLoad.current = false;
    }
  }, [onResolved]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function act(url: string, body?: unknown) {
    setBusy(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleBid(e: FormEvent) {
    e.preventDefault();
    const amount = Number(bidInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid bid amount');
      return;
    }
    const ok = await act('/api/auction/bid', { amount });
    if (ok) {
      setBidInput('');
      playBid();
    }
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[120px] text-[#666] text-[14px] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  const { status, player, bidCount, myBidExists, myBidAmount, bids, result } = state;
  const isOpen = status === 'open';
  const isResolved = status === 'resolved';

  return (
    <div className="flex flex-col gap-4">
      {/* Player card */}
      {showPlayerCard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative fifa-card backdrop-blur-md rounded-sm p-8 flex flex-col justify-center overflow-hidden min-h-[280px]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A94F]/40 to-transparent" />
          <div className="text-center relative z-10 space-y-5">
            <div
              className={cn(
                'inline-flex items-center gap-2 px-4 py-1.5 rounded-sm fifa-badge border',
                isOpen
                  ? 'bg-[#00A94F]/10 border-[#00A94F]/25 text-[#00A94F]'
                  : 'bg-[#E5A93D]/10 border-[#E5A93D]/25 text-[#E5A93D]'
              )}
            >
              <Radio className={cn('w-3.5 h-3.5', isOpen && 'animate-pulse')} />
              {isOpen ? 'Bidding open' : isResolved ? 'Result' : 'On the block'}
            </div>

            {player ? (
              <motion.div key={player.fifaId} className="space-y-4">
                <div className="flex justify-center">
                  <SquadFlag abbr={player.countryAbbr} size="xl" />
                </div>
                <h1 className="text-[36px] md:text-[60px] fifa-headline text-white leading-none">
                  {player.displayName}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <span className="px-3 py-1 rounded-sm bg-[#00A94F]/15 text-[#00A94F] fifa-badge border border-[#00A94F]/30">
                    {player.position}
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-sm bg-white/5 text-white fifa-badge border border-white/15">
                    <SquadFlag abbr={player.countryAbbr} size="sm" />
                    {player.countryAbbr}
                  </span>
                </div>
              </motion.div>
            ) : (
              <p className="text-[22px] md:text-[30px] fifa-headline text-white/70">
                No player on the block
              </p>
            )}
          </div>
        </motion.div>
      )}

      {error && (
        <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-sm px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Result + reveal */}
      {isResolved && result && (
        <div className="fifa-card rounded-sm p-5 border-[#00A94F]/25 space-y-4">
          <div className="flex items-center gap-3">
            {result.sold ? (
              <>
                <Trophy className="w-5 h-5 text-[#E5A93D]" />
                <p className="text-[15px] text-white">
                  Sold to <span className="text-[#00A94F] font-semibold">{result.teamName}</span>{' '}
                  for{' '}
                  <span className="fifa-stat-value text-[#E5A93D]">
                    ${result.amount?.toFixed(1)}M
                  </span>
                </p>
              </>
            ) : (
              <>
                <Ban className="w-5 h-5 text-white/40" />
                <p className="text-[15px] text-white/70">Unsold — no valid bid. Player set aside.</p>
              </>
            )}
          </div>

          {bids && bids.length > 0 && (
            <div className="border-t border-white/[0.08] pt-3">
              <p className="fifa-stat-label mb-2">All bids</p>
              <ul className="flex flex-col gap-1.5">
                {bids.map((b) => (
                  <li
                    key={b.teamId}
                    className={cn(
                      'flex items-center justify-between text-[13px] px-3 py-1.5 rounded-sm',
                      result.sold && b.teamName === result.teamName
                        ? 'bg-[#00A94F]/10 border border-[#00A94F]/20'
                        : 'bg-black/40'
                    )}
                  >
                    <span className="text-white/85 truncate">{b.teamName}</span>
                    <span
                      className={cn(
                        'fifa-stat-value shrink-0 ml-3',
                        b.amount === null ? 'text-white/30' : 'text-[#E5A93D]'
                      )}
                    >
                      {b.amount === null ? 'Pass' : `$${b.amount.toFixed(1)}M`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bidding status + my bid (open) */}
      {isOpen && (
        <div className="fifa-card rounded-sm p-5 border-[#00A94F]/25 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="fifa-stat-label flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A94F] animate-pulse" />
              Bids in (amounts hidden)
            </span>
            <div className="flex items-center gap-3">
              <span className="fifa-stat-value text-white">
                {bidCount}
                {totalTeams > 0 ? ` / ${totalTeams}` : ''}
              </span>
              <SoundToggle />
            </div>
          </div>
          {totalTeams > 0 && (
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-[#00A94F]/60 transition-all duration-500"
                style={{ width: `${Math.min(100, (bidCount / totalTeams) * 100)}%` }}
              />
            </div>
          )}

          {teamId ? (
            <>
              <div className="text-[13px]">
                {myBidExists ? (
                  myBidAmount === null ? (
                    <span className="text-white/50">You passed.</span>
                  ) : (
                    <span className="text-white/80">
                      Your bid:{' '}
                      <span className="fifa-stat-value text-[#E5A93D]">
                        ${myBidAmount.toFixed(1)}M
                      </span>{' '}
                      <span className="text-white/40">(you can still change it)</span>
                    </span>
                  )
                ) : (
                  <span className="text-white/50">No bid yet.</span>
                )}
              </div>

              <form onSubmit={handleBid} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[14px]">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    placeholder="Bid amount (M)"
                    disabled={busy}
                    className="w-full bg-black/50 border border-white/[0.08] rounded-lg pl-7 pr-3 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#00A94F]/40 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || !bidInput}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-[13px] font-display font-semibold uppercase tracking-wide bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F] hover:bg-[#00A94F]/25 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Bid
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act('/api/auction/bid', { pass: true })}
                  className="px-4 py-2.5 rounded-sm text-[13px] font-display font-semibold uppercase tracking-wide border border-white/[0.1] bg-white/[0.04] text-white/55 hover:text-white disabled:opacity-50"
                >
                  Pass
                </button>
              </form>
            </>
          ) : (
            <p className="text-[13px] text-[#888]">
              You&apos;re spectating — join a team in the lobby to place bids.
            </p>
          )}
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          {!isOpen && player && status === 'none' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => act('/api/auction/lot/open')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-[13px] font-display font-semibold uppercase tracking-wide bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F] hover:bg-[#00A94F]/25 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Open bidding
            </button>
          )}
          {isOpen && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => act('/api/auction/lot/close')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-[13px] font-display font-semibold uppercase tracking-wide bg-[#E5A93D]/15 border border-[#E5A93D]/40 text-[#E5A93D] hover:bg-[#E5A93D]/25 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Close &amp; resolve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => act('/api/auction/lot/cancel')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-[12px] font-display font-semibold uppercase tracking-wide border border-white/[0.1] bg-white/[0.04] text-white/55 hover:text-white disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </>
          )}
          {!isOpen && !player && status !== 'resolved' && (
            <p className="text-[13px] text-[#666] flex items-center gap-2">
              <Gavel className="w-3.5 h-3.5" />
              Draw or call up a player, then open bidding.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
