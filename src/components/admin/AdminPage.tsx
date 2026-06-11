'use client';

import { motion } from 'motion/react';
import { Settings, Users } from 'lucide-react';
import type { Manager } from '../../types';
import { MAX_TEAMS } from '../../config/constants';
import { PageHeader } from '../shared/PageHeader';
import { AddTeamForm } from './AddTeamForm';
import { TeamAdminList } from './TeamAdminList';
import { ImportFifaPool } from './ImportFifaPool';
import { ResetAuction } from './ResetAuction';
import { CreateUserForm } from './CreateUserForm';

interface AdminPageProps {
  leagueData: Manager[];
  onTeamAdded: () => void;
}

export function AdminPage({ leagueData, onTeamAdded }: AdminPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Admin"
        subtitle="Add franchises, then import the FIFA player pool for auction."
        icon={<Settings className="w-4 h-4" />}
        right={
          <div className="flex items-center gap-2 text-[13px] fifa-stat-value text-[#888] border border-[#00A94F]/15 rounded-sm px-4 py-2 bg-black/40 shrink-0">
            <Users className="w-4 h-4 text-[#00A94F]/70" />
            {leagueData.length} / {MAX_TEAMS} teams
          </div>
        }
      />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-sm p-6 sm:p-8"
      >
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888] mb-6 pb-3 border-b border-white/[0.06]">
          FIFA player pool
        </h3>
        <ImportFifaPool />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="rounded-2xl border border-[#00A94F]/20 bg-black/40 backdrop-blur-sm p-6 sm:p-8"
      >
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888] mb-6 pb-3 border-b border-white/[0.06]">
          Create player login
        </h3>
        <CreateUserForm leagueData={leagueData} onCreated={onTeamAdded} />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="rounded-2xl border border-red-500/20 bg-black/40 backdrop-blur-sm p-6 sm:p-8"
      >
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-red-400/80 mb-6 pb-3 border-b border-red-500/10">
          Reset auction
        </h3>
        <ResetAuction onReset={onTeamAdded} />
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-sm p-6 sm:p-8"
        >
          <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888] mb-6 pb-3 border-b border-white/[0.06]">
            Add team
          </h3>
          <AddTeamForm teamCount={leagueData.length} onSuccess={onTeamAdded} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-sm p-6 sm:p-8"
        >
          <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888] mb-6 pb-3 border-b border-white/[0.06]">
            Current teams
          </h3>

          <TeamAdminList leagueData={leagueData} onChanged={onTeamAdded} />
        </motion.section>
      </div>
    </div>
  );
}
