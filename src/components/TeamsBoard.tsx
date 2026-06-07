'use client';

import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { SQUAD_SIZE } from '../config/constants';
import { Manager } from '../types';
import { SplitText } from './SplitText';
import { AnimatedNumber } from './shared/AnimatedNumber';
import { PageHeader } from './shared/PageHeader';

interface TeamsBoardProps {
  leagueData: Manager[];
  onSelectTeam: (managerId: string) => void;
}

export function TeamsBoard({ leagueData, onSelectTeam }: TeamsBoardProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Franchises"
        subtitle="Team profiles and portfolio distribution"
      />

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
                <p className="text-[#888] text-[13px] flex items-center gap-1.5">
                  <Shield className="w-3 h-3 group-hover:text-white transition-colors" />
                  {manager.name}
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
