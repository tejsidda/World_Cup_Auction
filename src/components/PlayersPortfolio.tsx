'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, RefreshCw, Search, X, ArrowLeftRight } from 'lucide-react';
import { SQUAD_SIZE } from '../config/constants';
import { Player, Position, Manager } from '../types';
import { SplitText } from './SplitText';
import { AnimatedNumber } from './shared/AnimatedNumber';
import { SquadJersey } from './fifa/SquadJersey';
import type { PoolPlayer } from '../types/auction';

interface PlayersPortfolioProps {
  managerId: string;
  leagueData: Manager[];
  onBack: () => void;
  isAdmin?: boolean;
  onReplaced?: () => void;
}

interface ReplaceModalProps {
  player: Player;
  teamId: string;
  teamName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ReplaceModal({ player, teamId, teamName, onClose, onSuccess }: ReplaceModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PoolPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PoolPlayer | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPlayers = useCallback(async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/auction/replace?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load players');
      setResults(json.players ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPlayers(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchPlayers]);

  async function handleConfirm() {
    if (!selected) return;
    setConfirming(true);
    setError('');
    try {
      const res = await fetch('/api/auction/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingPlayerId: player.id,
          replacementFifaId: selected.fifaId,
          teamId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Replace failed');
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Replace failed');
    } finally {
      setConfirming(false);
    }
  }

  const positionColors: Record<string, string> = {
    GK: 'text-[#E5A93D]',
    DEF: 'text-[#4A9EFF]',
    MID: 'text-[#00A94F]',
    FWD: 'text-[#FF5F57]',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative z-10 w-full max-w-md bg-[#0a0a0a] border border-white/[0.1] rounded-sm shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.08]">
          <div>
            <p className="text-[11px] text-[#666] uppercase tracking-widest font-mono mb-1">
              Replace player in {teamName}
            </p>
            <h3 className="text-[16px] font-semibold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#00A94F]" />
              {player.name}
            </h3>
            <p className="text-[12px] text-[#666] mt-1 font-mono">
              {player.position} · {player.country}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#555] pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search unsold players…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm pl-9 pr-4 py-2 text-[13px] text-[#EDEDED] placeholder-[#444] outline-none focus:border-[#00A94F]/40 transition-colors"
            />
            {loading && (
              <RefreshCw className="absolute right-3 w-3.5 h-3.5 text-[#555] animate-spin" />
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="max-h-[280px] overflow-y-auto">
          {results.length === 0 && !loading ? (
            <p className="text-[13px] text-[#555] text-center py-8">
              {query.trim().length < 2
                ? 'Type to search unsold players'
                : 'No unsold players found'}
            </p>
          ) : (
            results.map((p) => (
              <button
                key={p.fifaId}
                onClick={() => setSelected(selected?.fifaId === p.fifaId ? null : p)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 text-left transition-colors ${
                  selected?.fifaId === p.fifaId
                    ? 'bg-[#00A94F]/10 border-[#00A94F]/20'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <SquadJersey
                  squadId={p.squadId}
                  countryAbbr={p.countryAbbr}
                  size="sm"
                  title={p.countryAbbr}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#EDEDED] truncate">
                    {p.displayName}
                  </p>
                  <p className="text-[11px] font-mono text-[#666] mt-0.5">
                    <span className={positionColors[p.position] ?? 'text-[#888]'}>{p.position}</span>
                    {' · '}{p.countryAbbr}
                    {p.auctionStatus === 'skipped' && (
                      <span className="ml-1.5 text-[#E5A93D]">skipped</span>
                    )}
                  </p>
                </div>
                <p className="text-[12px] font-mono text-[#888] shrink-0">
                  {p.points} <span className="text-[#555]">PTS</span>
                </p>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08]">
          {error && (
            <p className="text-[12px] text-red-400 mb-3">{error}</p>
          )}
          {selected && (
            <div className="mb-3 p-3 bg-white/[0.03] rounded-sm border border-white/[0.06] text-[12px] text-[#888]">
              <span className="text-[#EDEDED] font-medium">{player.name}</span>
              {' → '}
              <span className="text-[#00A94F] font-medium">{selected.displayName}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-[13px] text-[#888] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected || confirming}
              className="flex-1 py-2 text-[13px] font-semibold text-white bg-[#00A94F]/20 hover:bg-[#00A94F]/30 border border-[#00A94F]/30 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {confirming ? 'Replacing…' : 'Confirm Replace'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PlayersPortfolio({
  managerId,
  leagueData,
  onBack,
  isAdmin = false,
  onReplaced,
}: PlayersPortfolioProps) {
  const manager = leagueData.find((m) => m.id === managerId);
  const [replaceTarget, setReplaceTarget] = useState<Player | null>(null);

  if (!manager) return null;

  const groupedRoster: Record<Position, Player[]> = {
    GK: manager.roster.filter((p) => p.position === 'GK'),
    DEF: manager.roster.filter((p) => p.position === 'DEF'),
    MID: manager.roster.filter((p) => p.position === 'MID'),
    FWD: manager.roster.filter((p) => p.position === 'FWD'),
  };

  return (
    <>
      <motion.div layoutId={`manager-card-${managerId}`} className="flex flex-col gap-6 relative z-10 bg-transparent min-h-full">
        <header className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl py-6 border-b border-[#00A94F]/15 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-white/[0.03] hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/[0.08]"
            >
              ←
            </button>
            <div className="flex flex-col">
              <motion.h2 layoutId={`title-${manager.id}`} className="text-xl md:text-3xl fifa-headline text-white origin-left overflow-hidden pb-1">
                <SplitText text={manager.teamName} delay={0.1} />
              </motion.h2>
              <p className="text-[#888] text-[12px] mt-0.5 flex flex-wrap items-center gap-2">
                {manager.members.length === 0 ? (
                  <span className="italic text-[#666]">No members yet</span>
                ) : (
                  manager.members.map((m, i) => (
                    <span key={m.userId} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-[#555]">&middot;</span>}
                      {m.displayName}
                      {m.isCreator && (
                        <Crown className="w-2.5 h-2.5 text-[#E5A93D]" aria-label="Creator" />
                      )}
                    </span>
                  ))
                )}
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span className="font-mono">{manager.totalPoints} PTS</span>
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-mono text-[10px] text-[#888] tracking-widest uppercase">Capacity</p>
            <p className="font-mono text-[16px] text-white">
              {manager.squadCount}
              <span className="text-[#888]">/{SQUAD_SIZE}</span>
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-12 pb-12">
          {(['GK', 'DEF', 'MID', 'FWD'] as Position[]).map((pos, posIndex) => (
            <motion.section
              key={pos}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: posIndex * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              className="flex flex-col gap-6"
            >
              <h3 className="text-[13px] font-semibold tracking-widest text-[#888] border-b border-white/[0.08] pb-3 uppercase flex items-center gap-2 w-full">
                {pos}
                <span className="font-mono bg-white/[0.04] text-white/50 px-2 py-0.5 ml-2 rounded">
                  {groupedRoster[pos].length}
                </span>
              </h3>

              {groupedRoster[pos].length === 0 ? (
                <p className="text-[13px] text-[#666]">No players yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupedRoster[pos].map((player) => (
                    <motion.div
                      key={player.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      data-premium={player.points > 0 ? 'true' : 'false'}
                      className="rounded-xl border border-white/[0.08] bg-black/50 backdrop-blur-sm p-5 group hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <SquadJersey
                          squadId={player.squadId}
                          countryAbbr={player.country}
                          size="md"
                          title={player.country}
                        />
                        {player.price != null && (
                          <span className="text-[10px] font-mono text-[#888]">${player.price}M</span>
                        )}
                      </div>
                      <h4 className="font-medium text-[#EDEDED] text-[15px] tracking-tight truncate group-hover:text-white mb-4">
                        {player.name}
                      </h4>
                      <div className="pt-4 border-t border-white/[0.04] flex items-end justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-[#888] font-mono">Points</span>
                          <p className="font-mono text-[18px] tabular-nums text-white font-medium mt-1">
                            <AnimatedNumber value={player.points} />
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => setReplaceTarget(player)}
                            title="Replace player"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-[#00A94F]/15 border border-white/[0.06] hover:border-[#00A94F]/30 text-[#666] hover:text-[#00A94F] transition-colors text-[11px] font-medium"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            Replace
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {replaceTarget && (
          <ReplaceModal
            player={replaceTarget}
            teamId={manager.id}
            teamName={manager.teamName}
            onClose={() => setReplaceTarget(null)}
            onSuccess={() => {
              setReplaceTarget(null);
              onReplaced?.();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
