'use client';

import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import { Manager } from '../types';
import { cn } from '../lib/utils';
import { SplitText } from './SplitText';
import { AnimatedNumber } from './shared/AnimatedNumber';
import { PageHeader } from './shared/PageHeader';

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const height = 24;
  const width = 60;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / (max - min || 1)) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible stroke-white/30 fill-none hidden md:block" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} />
    </svg>
  );
}

interface PointsTableProps {
  leagueData: Manager[];
}

export function PointsTable({ leagueData }: PointsTableProps) {
  const maxPointsLast24h = Math.max(...leagueData.map(m => m.pointsLast24h));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leaderboard"
        subtitle="Real-time asset accumulation standings"
      />

      <div className="flex flex-col border-t border-[#00A94F]/10">
        {leagueData.map((manager, index) => {
          const isTopMover = manager.pointsLast24h > 0 && manager.pointsLast24h === maxPointsLast24h;

          return (
            <motion.div
              layout
              key={manager.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, delay: index * 0.05 }}
              data-premium={index < 3 ? "true" : "false"}
              className={cn(
                "relative flex flex-row items-center justify-between py-4 sm:py-5 min-h-[72px] bg-transparent group cursor-default border-b fifa-row-rule hover:bg-[#00A94F]/[0.03] transition-colors"
              )}
            >
              <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1 px-4">
                <div className="text-[14px] fifa-stat-value text-[#888] w-4 sm:w-6 relative shrink-0">
                  <motion.div layout>
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </motion.div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-[#EDEDED] flex flex-wrap items-center gap-2 sm:gap-3 text-[14px] sm:text-[15px] overflow-hidden pb-[2px]">
                    <SplitText text={manager.teamName} delay={index * 0.04} stagger={0.015} className="truncate max-w-full" />
                    {isTopMover && <span className="flex items-center text-[#00A94F] border border-[#00A94F]/25 bg-[#00A94F]/10 px-1.5 py-[1px] rounded-sm text-[9px] uppercase tracking-widest font-display font-semibold shrink-0">Top Mover</span>}
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#666] truncate flex flex-wrap items-center gap-1.5">
                    {manager.members.length === 0 ? (
                      <span className="italic text-[#555]">No members yet</span>
                    ) : (
                      manager.members.map((m, i) => (
                        <span key={m.userId} className="inline-flex items-center gap-1">
                          {i > 0 && <span className="text-[#444]">&middot;</span>}
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

              <div className="flex flex-row items-center justify-end gap-6 sm:gap-10 pr-4 shrink-0">
                <Sparkline data={manager.history} />
                <div className="flex flex-col items-end hidden sm:flex">
                   <p className="fifa-stat-label">Sync Flow</p>
                   <div className="flex items-center text-[#888] mt-0.5">
                     <span className="font-mono text-[14px] tabular-nums flex items-center">
                       {manager.pointsLast24h > 0 ? '+' : ''}
                       <AnimatedNumber value={manager.pointsLast24h} />
                     </span>
                   </div>
                </div>

                <div className="flex flex-col items-end sm:w-32">
                  <p className="fifa-stat-label hidden sm:block">Total</p>
                  <p className="fifa-stat-label sm:hidden">PTS</p>
                  <p className="fifa-stat-value text-[18px] sm:text-[22px] text-[#EDEDED] transition-colors mt-0.5">
                    <AnimatedNumber value={manager.totalPoints} />
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
