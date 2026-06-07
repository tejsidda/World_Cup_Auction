'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, X } from 'lucide-react';
import type { Manager } from '@/types';
import { SQUAD_SIZE } from '@/config/constants';
import { getBudgetRemainingM } from '@/lib/budget';
import { cn } from '@/lib/utils';

interface FranchisePickerProps {
  leagueData: Manager[];
  selectedId: string;
  onSelect: (teamId: string) => void;
  disabled?: boolean;
}

export function FranchisePicker({
  leagueData,
  selectedId,
  onSelect,
  disabled,
}: FranchisePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = leagueData.find((m) => m.id === selectedId);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 rounded-sm border text-left transition-colors',
          'bg-black/50 border-white/[0.08] hover:border-[#00A94F]/25 disabled:opacity-50',
          selected && 'border-[#00A94F]/30 bg-[#00A94F]/5'
        )}
      >
        {selected ? (
          <div className="min-w-0">
            <p className="text-[14px] font-display font-bold uppercase tracking-wide text-white truncate">
              {selected.teamName}
            </p>
            <p className="fifa-stat-label mt-0.5">
              ${getBudgetRemainingM(selected).toFixed(1)}M left · {selected.squadCount}/{SQUAD_SIZE}
            </p>
          </div>
        ) : (
          <span className="text-[14px] text-white/40">Select winning franchise…</span>
        )}
        <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="fixed inset-x-4 top-[20vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm z-50 fifa-card backdrop-blur-xl rounded-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#00A94F]/15">
                <h3 className="fifa-section-title">Winning franchise</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-sm border border-white/10 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                {leagueData.map((team) => {
                  const remaining = getBudgetRemainingM(team);
                  const full = team.squadCount >= SQUAD_SIZE;
                  const isSelected = team.id === selectedId;
                  return (
                    <li key={team.id}>
                      <button
                        type="button"
                        disabled={full}
                        onClick={() => {
                          onSelect(team.id);
                          setOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-3 rounded-sm border text-left transition-colors',
                          isSelected
                            ? 'bg-[#00A94F]/15 border-[#00A94F]/35'
                            : 'bg-transparent border-transparent hover:bg-white/[0.04]',
                          full && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-display font-bold uppercase tracking-wide text-white truncate">
                            {team.teamName}
                          </p>
                          <p className="fifa-stat-label mt-0.5 truncate">{team.name}</p>
                          <p className="fifa-stat-label mt-1">
                            <span className="text-[#E5A93D]">${remaining.toFixed(1)}M</span>
                            {' · '}
                            <span className={full ? 'text-red-400' : ''}>
                              {team.squadCount}/{SQUAD_SIZE}
                            </span>
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#00A94F] shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
