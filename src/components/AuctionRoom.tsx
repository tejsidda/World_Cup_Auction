'use client';

import { motion } from 'motion/react';
import { Gavel, Wallet, Users, ChevronDown, ChevronUp, Radio, Loader2, Shuffle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Manager, PoolStats } from '../types';
import type { AuctionPhase, PoolPlayer } from '../types/auction';
import { getBudgetRemainingM } from '../lib/budget';
import { DrawRulesPanel } from './auction/DrawRulesPanel';
import { PlayerSearch } from './auction/PlayerSearch';
import { SellPlayerForm } from './auction/SellPlayerForm';
import { RecentlySold, notifySaleRecorded } from './auction/RecentlySold';
import { BiddingPanel } from './auction/BiddingPanel';
import { SquadFlag } from './fifa/SquadFlag';
import { PageHeader } from './shared/PageHeader';
import { SectionHeader } from './shared/SectionHeader';
import { AuctionSetup } from './auction/AuctionSetup';

interface AuctionRoomProps {
  leagueData: Manager[];
  onSold?: () => void;
}

export function AuctionRoom({ leagueData, onSold }: AuctionRoomProps) {
  const [phase, setPhase] = useState<AuctionPhase | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [onBlock, setOnBlock] = useState<PoolPlayer | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [callingUp, setCallingUp] = useState<number | null>(null);

  const loadPhase = useCallback(async () => {
    try {
      const res = await fetch('/api/auction/status');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPhase(data.phase ?? 'setup');
    } catch {
      setPhase('setup');
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [statsRes, blockRes] = await Promise.all([
        fetch('/api/pool/stats'),
        fetch('/api/auction/on-block'),
      ]);
      const stats = await statsRes.json();
      const block = await blockRes.json();
      if (stats.error) setPoolError(stats.error);
      else {
        setPoolStats(stats);
        setPoolError(null);
      }
      setOnBlock(block.player ?? null);
    } catch {
      setPoolError('Could not load auction state');
    }
  }, []);

  useEffect(() => {
    loadPhase();
    refresh();
  }, [loadPhase, refresh]);

  useEffect(() => {
    const handler = () => {
      loadPhase();
      refresh();
    };
    window.addEventListener('auction:reset', handler);
    return () => window.removeEventListener('auction:reset', handler);
  }, [loadPhase, refresh]);

  async function handleDraw() {
    setDrawing(true);
    setDrawError(null);
    try {
      const res = await fetch('/api/auction/draw', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Draw failed');
      setOnBlock(data.player);
      await refresh();
    } catch (err) {
      setDrawError(err instanceof Error ? err.message : 'Draw failed');
    } finally {
      setDrawing(false);
    }
  }

  async function handleCallUp(fifaId: number) {
    setCallingUp(fifaId);
    setDrawError(null);
    try {
      const res = await fetch('/api/auction/call-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fifaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Call-up failed');
      setOnBlock(data.player);
      await refresh();
    } catch (err) {
      setDrawError(err instanceof Error ? err.message : 'Call-up failed');
    } finally {
      setCallingUp(null);
    }
  }

  async function handleSold() {
    await refresh();
    notifySaleRecorded();
    onSold?.();
  }

  function handleAuctionStarted() {
    setPhase('in_progress');
    refresh();
  }

  if (phase === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-[#666] text-[14px]">Loading auction…</p>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <AuctionSetup
        leagueData={leagueData}
        onTeamAdded={() => onSold?.()}
        onStarted={handleAuctionStarted}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto min-h-[calc(100vh-140px)]">
      <PageHeader
        kicker="WC26 · Live"
        title="Auction in progress"
        subtitle="Draw players, run the hammer, and track franchise budgets."
        icon={<Gavel className="w-4 h-4" />}
        meta={
          poolStats && poolStats.total > 0 ? (
            <p className="fifa-stat-label mt-3 flex flex-wrap gap-x-3 gap-y-1">
              <span>
                Pool <span className="fifa-stat-value text-white ml-1">{poolStats.available}</span> available
              </span>
              <span className="text-white/20">|</span>
              <span>
                <span className="fifa-stat-value text-[#E5A93D] ml-1">{poolStats.onBlock}</span> on block
              </span>
              <span className="text-white/20">|</span>
              <span>
                <span className="fifa-stat-value text-[#00A94F] ml-1">{poolStats.sold}</span> sold
              </span>
            </p>
          ) : undefined
        }
        right={
          <div className="hidden md:flex flex-col items-end shrink-0">
            <span className="fifa-stat-label mb-1.5">Status</span>
            <span className="px-3 py-1.5 bg-[#00A94F]/10 border border-[#00A94F]/25 text-[#00A94F] rounded-sm text-[13px] font-display font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A94F] animate-pulse" />
              {onBlock ? 'On block' : 'Awaiting draw'}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 flex-1">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative fifa-card backdrop-blur-md rounded-sm p-8 flex-1 flex flex-col justify-center overflow-hidden min-h-[280px]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A94F]/40 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] max-w-[800px] bg-[#00A94F]/[0.03] blur-[80px] rounded-full pointer-events-none" />

            <div className="text-center relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-[#E5A93D]/10 border border-[#E5A93D]/25 text-[#E5A93D] fifa-badge">
                <Radio className="w-3.5 h-3.5" />
                On the block
              </div>

              {!poolStats || poolStats.total === 0 ? (
                <div className="space-y-3">
                  <p className="text-[24px] md:text-[32px] fifa-headline text-white/85">
                    No players in pool yet
                  </p>
                  <p className="fifa-subtitle text-center">
                    Admin → Import FIFA player pool first.
                  </p>
                  {poolError && <p className="text-red-400/80 text-[13px] font-mono">{poolError}</p>}
                </div>
              ) : onBlock ? (
                <div className="space-y-5">
                  <div className="flex justify-center">
                    <SquadFlag abbr={onBlock.countryAbbr} size="xl" />
                  </div>
                  <h1 className="text-[38px] md:text-[68px] fifa-headline text-white leading-none">
                    {onBlock.displayName}
                  </h1>
                  <div className="flex items-center justify-center gap-3">
                    <span className="px-3 py-1 rounded-sm bg-[#00A94F]/15 text-[#00A94F] fifa-badge border border-[#00A94F]/30">
                      {onBlock.position}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 rounded-sm bg-white/5 text-white fifa-badge border border-white/15">
                      <SquadFlag abbr={onBlock.countryAbbr} size="sm" />
                      {onBlock.countryAbbr}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[24px] md:text-[32px] fifa-headline text-white/70">
                    No player on block
                  </p>
                  <p className="fifa-subtitle text-center">
                    Hit Draw random or search for a player to call up.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {!onBlock && poolStats && poolStats.total > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDraw}
                disabled={drawing}
                className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-sm border border-[#E5A93D]/40 bg-[#E5A93D]/15 text-[#E5A93D] hover:bg-[#E5A93D]/25 disabled:opacity-50 transition-colors shadow-[0_0_32px_rgba(229,169,61,0.12)]"
              >
                {drawing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Shuffle className="w-5 h-5" />
                )}
                <span className="fifa-headline text-[20px] md:text-[26px]">
                  {drawing ? 'Drawing…' : 'Draw random'}
                </span>
              </button>
              {drawError && (
                <p className="text-[12px] text-red-400 text-center px-2">{drawError}</p>
              )}
            </div>
          )}

          <div className="fifa-card backdrop-blur-sm rounded-sm p-5 border-[#00A94F]/20">
            <SectionHeader
              title="Blind bidding"
              accent="green"
              icon={<Gavel className="w-4 h-4 text-[#00A94F]/70" />}
            />
            <div className="mt-3">
              <BiddingPanel
                isAdmin
                showPlayerCard={false}
                totalTeams={leagueData.length}
                onResolved={handleSold}
              />
            </div>
          </div>

          <div className="fifa-card backdrop-blur-sm rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setDrawOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#00A94F]/[0.04] transition-colors"
            >
              <span className="fifa-panel-label flex items-center gap-2.5">
                <span className="w-[3px] h-3.5 rounded-full bg-[#00A94F]" />
                Draw pool · nation filter
              </span>
              {drawOpen ? <ChevronUp className="w-4 h-4 text-[#00A94F]/60" /> : <ChevronDown className="w-4 h-4 text-[#00A94F]/60" />}
            </button>
            {drawOpen && (
              <div className="px-5 pb-5 border-t border-[#00A94F]/15 pt-4">
                <DrawRulesPanel />
              </div>
            )}
          </div>

          <div className="fifa-card backdrop-blur-sm rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#00A94F]/[0.04] transition-colors"
            >
              <span className="fifa-panel-label flex items-center gap-2.5">
                <span className="w-[3px] h-3.5 rounded-full bg-[#E5A93D]" />
                Search & call up
              </span>
              {searchOpen ? <ChevronUp className="w-4 h-4 text-[#E5A93D]/60" /> : <ChevronDown className="w-4 h-4 text-[#E5A93D]/60" />}
            </button>
            {searchOpen && (
              <div className="px-5 pb-5 border-t border-[#00A94F]/15 pt-4">
                <PlayerSearch onCallUp={handleCallUp} callingUp={callingUp} />
              </div>
            )}
          </div>

          {onBlock && (
            <div className="fifa-card backdrop-blur-sm rounded-sm p-5 border-[#00A94F]/25">
              <SectionHeader title="Record sale" accent="green" icon={<Gavel className="w-4 h-4 text-[#00A94F]/70" />} />
              <SellPlayerForm leagueData={leagueData} onSold={handleSold} />
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="fifa-card backdrop-blur-md rounded-sm p-6 flex flex-col gap-4">
            <SectionHeader title="Remaining budgets" icon={<Wallet className="w-5 h-5" />} />
            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {leagueData.map((team, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={team.id}
                  className="flex items-center justify-between p-3 rounded-sm border bg-black/50 border-[#00A94F]/10"
                >
                  <div>
                    <div className="text-white font-display font-bold text-[15px] truncate max-w-[150px] tracking-wide uppercase">
                      {team.teamName}
                    </div>
                    <div className="fifa-stat-label mt-0.5 truncate max-w-[150px]">
                      {team.members.map((m) => m.displayName).join(' · ') || 'No members yet'}
                    </div>
                  </div>
                  <div className="fifa-stat-value text-[#E5A93D] text-[15px]">
                    ${getBudgetRemainingM(team).toFixed(1)}M
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="fifa-card backdrop-blur-md rounded-sm p-6 flex flex-col gap-4 flex-1 min-h-0">
            <SectionHeader title="Recently sold" accent="gold" icon={<Gavel className="w-5 h-5 text-[#00A94F]/60" />} />
            <div className="overflow-y-auto pr-1 custom-scrollbar flex-1">
              <RecentlySold />
            </div>
          </div>

          <div className="fifa-card rounded-sm p-4 flex flex-col gap-3">
            <h3 className="fifa-panel-label flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-[#00A94F]/70" />
              Pool summary
            </h3>
            {poolStats ? (
              <>
                <div className="flex justify-between text-[13px] py-1 border-b border-[#00A94F]/10">
                  <span className="fifa-stat-label">Available</span>
                  <span className="fifa-stat-value text-white">{poolStats.available}</span>
                </div>
                <div className="flex justify-between text-[13px] py-1 border-b border-[#00A94F]/10">
                  <span className="fifa-stat-label">On block</span>
                  <span className="fifa-stat-value text-[#E5A93D]">{poolStats.onBlock}</span>
                </div>
                <div className="flex justify-between text-[13px] py-1">
                  <span className="fifa-stat-label">Sold</span>
                  <span className="fifa-stat-value text-[#00A94F]">{poolStats.sold}</span>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[#666]">Loading pool…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
