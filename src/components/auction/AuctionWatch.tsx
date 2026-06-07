'use client';

import { Wallet, Users, Gavel, Radio } from 'lucide-react';
import type { Manager } from '@/types';
import { SQUAD_SIZE } from '@/config/constants';
import { getBudgetRemainingM } from '@/lib/budget';
import { SquadFlag } from '@/components/fifa/SquadFlag';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { PageHeader } from '@/components/shared/PageHeader';
import { RecentlySold } from '@/components/auction/RecentlySold';
import { BiddingPanel } from '@/components/auction/BiddingPanel';
import { cn } from '@/lib/utils';

interface AuctionWatchProps {
  leagueData: Manager[];
  myTeamId: string | null;
  onResolved?: () => void;
}

export function AuctionWatch({ leagueData, myTeamId, onResolved }: AuctionWatchProps) {
  const myTeam = myTeamId ? leagueData.find((t) => t.id === myTeamId) ?? null : null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
      <PageHeader
        kicker="WC26 · Live"
        title="Auction Room"
        subtitle="Place your blind bid when the host opens the window."
        icon={<Radio className="w-4 h-4" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <BiddingPanel
            isAdmin={false}
            totalTeams={leagueData.length}
            showPlayerCard
            onResolved={onResolved}
          />

          {/* My team */}
          {myTeam ? (
            <div className="fifa-card backdrop-blur-sm rounded-sm p-5 border-[#00A94F]/25">
              <SectionHeader
                title="Your team"
                accent="green"
                icon={<Users className="w-4 h-4 text-[#00A94F]/70" />}
              />
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-white font-display font-bold text-[16px] uppercase tracking-wide">
                    {myTeam.teamName}
                  </p>
                  <p className="fifa-stat-label mt-0.5 flex items-center gap-2">
                    <span>{myTeam.squadCount}/{SQUAD_SIZE} signed</span>
                    {myTeam.squadCount >= SQUAD_SIZE && (
                      <span className="text-[10px] uppercase tracking-wide text-[#00A94F] border border-[#00A94F]/40 rounded px-1.5 py-0.5">
                        Squad full
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="fifa-stat-label">Budget left</p>
                  <p className="fifa-stat-value text-[#E5A93D] text-[20px]">
                    ${getBudgetRemainingM(myTeam).toFixed(1)}M
                  </p>
                </div>
              </div>
              {myTeam.roster.length > 0 && (
                <ul className="mt-4 flex flex-col gap-1.5 border-t border-[#00A94F]/10 pt-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {myTeam.roster.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between text-[13px] text-white/80"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <SquadFlag abbr={p.country} size="sm" />
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="fifa-stat-value text-[#E5A93D] shrink-0 ml-3">
                        ${Number(p.price ?? 0).toFixed(1)}M
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="fifa-card rounded-sm p-5 border border-white/[0.08] text-[13px] text-[#888]">
              You&apos;re watching as a spectator — you haven&apos;t joined a team. Head to the
              lobby to create or join one.
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="fifa-card backdrop-blur-md rounded-sm p-6 flex flex-col gap-4">
            <SectionHeader title="Remaining budgets" icon={<Wallet className="w-5 h-5" />} />
            <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
              {leagueData.map((team) => (
                <div
                  key={team.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-sm border bg-black/50',
                    team.id === myTeamId ? 'border-[#00A94F]/40' : 'border-[#00A94F]/10'
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-white font-display font-bold text-[15px] truncate max-w-[150px] tracking-wide uppercase">
                      {team.teamName}
                      {team.id === myTeamId && (
                        <span className="ml-2 text-[10px] text-[#00A94F]">YOU</span>
                      )}
                    </div>
                    <div className="fifa-stat-label mt-0.5">
                      {team.squadCount} player{team.squadCount === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="fifa-stat-value text-[#E5A93D] text-[15px] shrink-0 ml-2">
                    ${getBudgetRemainingM(team).toFixed(1)}M
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fifa-card backdrop-blur-md rounded-sm p-6 flex flex-col gap-4">
            <SectionHeader
              title="Recently sold"
              accent="gold"
              icon={<Gavel className="w-5 h-5 text-[#00A94F]/60" />}
            />
            <div className="overflow-y-auto pr-1 custom-scrollbar max-h-[280px]">
              <RecentlySold />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
