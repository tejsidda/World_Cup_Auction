'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Users, Search, X } from 'lucide-react';
import { SQUAD_SIZE } from '../config/constants';
import { Manager } from '../types';
import { SplitText } from './SplitText';
import { AnimatedNumber } from './shared/AnimatedNumber';
import { PageHeader } from './shared/PageHeader';
import { SquadJersey } from './fifa/SquadJersey';

interface TeamsBoardProps {
  leagueData: Manager[];
  onSelectTeam: (managerId: string) => void;
}

export function TeamsBoard({ leagueData, onSelectTeam }: TeamsBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: Array<{
      player: Manager['roster'][number];
      manager: Manager;
    }> = [];
    for (const manager of leagueData) {
      for (const player of manager.roster) {
        if (
          player.name.toLowerCase().includes(q) ||
          player.country.toLowerCase().includes(q)
        ) {
          results.push({ player, manager });
        }
      }
    }
    return results.slice(0, 40);
  }, [searchQuery, leagueData]);

  const showResults = searchQuery.trim().length >= 2;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Franchises"
        subtitle="Team profiles and portfolio distribution"
      />

      {/* Player search */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-[#666] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players across franchises…"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm pl-9 pr-9 py-2.5 text-[13px] text-[#EDEDED] placeholder-[#555] outline-none focus:border-[#00A94F]/40 focus:bg-white/[0.05] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[#666] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#0a0a0a] border border-white/[0.08] rounded-sm shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto"
            >
              {searchResults.length === 0 ? (
                <p className="text-[13px] text-[#666] px-4 py-4 text-center">
                  No players found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-white/[0.06]">
                    <p className="text-[11px] text-[#666] font-mono uppercase tracking-widest">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {searchResults.map(({ player, manager }) => (
                    <motion.button
                      key={player.id}
                      onClick={() => {
                        onSelectTeam(manager.id);
                        setSearchQuery('');
                      }}
                      whileHover={{ backgroundColor: 'rgba(0,169,79,0.06)' }}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 text-left transition-colors"
                    >
                      <SquadJersey
                        squadId={player.squadId}
                        countryAbbr={player.country}
                        size="sm"
                        title={player.country}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#EDEDED] truncate">
                          {player.name}
                        </p>
                        <p className="text-[11px] text-[#666] font-mono mt-0.5">
                          {player.position} · {player.country}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-mono text-[#888]">
                          {player.points} <span className="text-[#555]">PTS</span>
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-[#00A94F]/10 border border-[#00A94F]/20 text-[10px] text-[#00A94F] font-medium truncate max-w-[120px]">
                          {manager.teamName}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {leagueData.map((manager, index) => (
          <motion.div
            layoutId={`manager-card-${manager.id}`}
            key={manager.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, delay: index * 0.05 }}
            onClick={() => onSelectTeam(manager.id)}
            data-premium={index < 3 ? "true" : "false"}
            className="group relative p-5 rounded-sm fifa-card backdrop-blur-sm cursor-pointer overflow-hidden transition-colors hover:bg-[#00A94F]/[0.04]"
          >
            <div className="flex items-start justify-between mb-6 relative z-10 border-b border-[#00A94F]/10 pb-4">
              <div className="flex flex-col gap-1 w-full">
                <motion.h3 layoutId={`title-${manager.id}`} className="font-medium text-[#EDEDED] text-[16px] tracking-tight origin-left pr-4 truncate overflow-hidden pb-[2px]">
                  <SplitText text={manager.teamName} delay={index * 0.04} stagger={0.015} className="truncate max-w-full" />
                </motion.h3>
                <p className="text-[#888] text-[13px] flex items-center gap-1.5 flex-wrap">
                  <Users className="w-3 h-3 shrink-0" />
                  {manager.members.length === 0 ? (
                    <span className="text-[#666] italic">No members yet</span>
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
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
               <div className="flex flex-col gap-1">
                 <div className="text-[#888] text-[10px] uppercase tracking-widest flex items-center gap-1 font-mono">
                   Yield Total
                 </div>
                 <div className="font-mono text-[18px] font-medium tabular-nums text-[#EDEDED]">
                   <AnimatedNumber value={manager.totalPoints} />
                 </div>
               </div>
               <div className="flex flex-col gap-1">
                 <div className="text-[#888] text-[10px] uppercase tracking-widest flex items-center gap-1 font-mono">
                   Capacity
                 </div>
                 <div className="font-mono text-[18px] tabular-nums text-[#EDEDED]">
                   <span className={manager.squadCount === SQUAD_SIZE ? "text-white font-medium" : "text-[#888]"}>{manager.squadCount}</span><span className="text-[#888] text-[14px]">/{SQUAD_SIZE}</span>
                 </div>
               </div>
            </div>

            <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05] group-hover:bg-white/[0.05] transition-colors relative z-10 flex items-center justify-between">
              <div className="truncate flex-1 pr-2">
                <p className="text-[10px] text-[#888] uppercase tracking-widest font-mono mb-1">Top Asset</p>
                <p className="text-[13px] font-medium text-white truncate">{manager.topAsset.name}</p>
              </div>
              <div className="text-right">
                 <p className="font-mono text-[14px] text-white font-medium">
                   <AnimatedNumber value={manager.topAsset.points} /> <span className="text-[10px] text-[#888]">PTS</span>
                 </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
