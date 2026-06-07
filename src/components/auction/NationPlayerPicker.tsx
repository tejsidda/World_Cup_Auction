'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Users, Check } from 'lucide-react';
import type { NationDrawRule, PoolPlayer } from '@/types/auction';
import { cn } from '@/lib/utils';
import { SquadFlag } from '@/components/fifa/SquadFlag';

interface NationPlayerPickerProps {
  countryAbbr: string | null;
  existingRule?: NationDrawRule;
  onClose: () => void;
  onConfirm: (abbr: string, rule: NationDrawRule) => void;
  onRemove: (abbr: string) => void;
}

export function NationPlayerPicker({
  countryAbbr,
  existingRule,
  onClose,
  onConfirm,
  onRemove,
}: NationPlayerPickerProps) {
  const [players, setPlayers] = useState<PoolPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'whole' | 'pick'>('whole');

  const load = useCallback(async (abbr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pool/players?country=${encodeURIComponent(abbr)}`);
      const data = await res.json();
      setPlayers(data.players ?? []);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!countryAbbr) return;
    if (existingRule?.mode === 'pick') {
      setMode('pick');
      setSelected(new Set(existingRule.playerIds));
    } else if (existingRule?.mode === 'whole') {
      setMode('whole');
      setSelected(new Set());
    } else {
      setMode('whole');
      setSelected(new Set());
    }
    load(countryAbbr);
  }, [countryAbbr, existingRule, load]);

  function togglePlayer(fifaId: number) {
    setMode('pick');
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fifaId)) next.delete(fifaId);
      else next.add(fifaId);
      return next;
    });
  }

  function selectWholeTeam() {
    setMode('whole');
    setSelected(new Set());
  }

  function handleConfirm() {
    if (!countryAbbr) return;
    if (mode === 'whole') {
      onConfirm(countryAbbr, { mode: 'whole' });
    } else if (selected.size > 0) {
      onConfirm(countryAbbr, { mode: 'pick', playerIds: [...selected] });
    }
    onClose();
  }

  const availableCount = players.filter((p) => p.auctionStatus === 'available').length;

  return (
    <AnimatePresence>
      {countryAbbr && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-4 top-[8vh] bottom-[8vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 flex flex-col fifa-card backdrop-blur-xl rounded-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#00A94F]/15 shrink-0">
              <div className="flex items-center gap-3">
                <SquadFlag abbr={countryAbbr} size="md" />
                <div>
                  <h3 className="fifa-section-title">{countryAbbr}</h3>
                  <p className="fifa-stat-label mt-0.5">{availableCount} available players</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-sm border border-white/10 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[#00A94F]/10 shrink-0">
              <button
                type="button"
                onClick={selectWholeTeam}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-sm border text-left transition-colors',
                  mode === 'whole'
                    ? 'bg-[#00A94F]/15 border-[#00A94F]/35 text-[#00A94F]'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white'
                )}
              >
                <Users className="w-4 h-4 shrink-0" />
                <div>
                  <p className="fifa-badge text-[13px]">Whole squad</p>
                  <p className="text-[12px] text-white/50 mt-0.5">All available players from {countryAbbr}</p>
                </div>
                {mode === 'whole' && <Check className="w-4 h-4 ml-auto shrink-0" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
              {loading ? (
                <p className="text-[13px] text-[#666] flex items-center gap-2 py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading squad…
                </p>
              ) : players.length === 0 ? (
                <p className="text-[13px] text-[#666] py-8 text-center">No players found.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {players.map((p) => {
                    const isOn = mode === 'pick' && selected.has(p.fifaId);
                    return (
                      <li key={p.fifaId}>
                        <button
                          type="button"
                          disabled={p.auctionStatus !== 'available'}
                          onClick={() => togglePlayer(p.fifaId)}
                          className={cn(
                            'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm border text-left transition-colors',
                            isOn
                              ? 'bg-[#00A94F]/10 border-[#00A94F]/25'
                              : 'bg-transparent border-transparent hover:bg-white/[0.03]',
                            p.auctionStatus !== 'available' && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-[13px] text-white font-medium truncate">{p.displayName}</p>
                            <p className="fifa-stat-label">{p.position}</p>
                          </div>
                          {isOn && <Check className="w-3.5 h-3.5 text-[#00A94F] shrink-0" />}
                          {p.auctionStatus === 'on_block' && (
                            <span className="fifa-badge text-[10px] text-[#E5A93D]">On block</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#00A94F]/15 flex flex-wrap gap-2 shrink-0">
              {existingRule && (
                <button
                  type="button"
                  onClick={() => {
                    onRemove(countryAbbr);
                    onClose();
                  }}
                  className="text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2.5 rounded-sm border border-red-500/25 text-red-400 hover:bg-red-500/10"
                >
                  Remove nation
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2.5 rounded-sm border border-white/10 text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={mode === 'pick' && selected.size === 0}
                className="ml-auto text-[12px] font-display font-semibold uppercase tracking-wide px-5 py-2.5 rounded-sm border border-[#00A94F]/30 bg-[#00A94F]/15 text-[#00A94F] hover:bg-[#00A94F]/25 disabled:opacity-40"
              >
                {mode === 'whole' ? 'Add whole squad' : `Add ${selected.size} player${selected.size === 1 ? '' : 's'}`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
