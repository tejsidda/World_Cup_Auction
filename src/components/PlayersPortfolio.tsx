'use client';

import { motion } from 'motion/react';
import { SQUAD_SIZE } from '../config/constants';
import { Player, Position, Manager } from '../types';
import { SplitText } from './SplitText';
import { AnimatedNumber } from './shared/AnimatedNumber';
import { SquadJersey } from './fifa/SquadJersey';

interface PlayersPortfolioProps {
  managerId: string;
  leagueData: Manager[];
  onBack: () => void;
}

export function PlayersPortfolio({ managerId, leagueData, onBack }: PlayersPortfolioProps) {
  const manager = leagueData.find((m) => m.id === managerId);
  if (!manager) return null;

  const groupedRoster: Record<Position, Player[]> = {
    GK: manager.roster.filter((p) => p.position === 'GK'),
    DEF: manager.roster.filter((p) => p.position === 'DEF'),
    MID: manager.roster.filter((p) => p.position === 'MID'),
    FWD: manager.roster.filter((p) => p.position === 'FWD'),
  };

  return (
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
              <span>{manager.name}</span>
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
                    <div className="pt-4 border-t border-white/[0.04]">
                      <span className="text-[10px] uppercase tracking-widest text-[#888] font-mono">Points</span>
                      <p className="font-mono text-[18px] tabular-nums text-white font-medium mt-1">
                        <AnimatedNumber value={player.points} />
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        ))}
      </div>
    </motion.div>
  );
}
