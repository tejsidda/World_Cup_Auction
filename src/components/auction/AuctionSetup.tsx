'use client';

import { useState } from 'react';
import { Loader2, Play, Users } from 'lucide-react';
import type { Manager } from '@/types';
import { PageHeader } from '../shared/PageHeader';
import { SectionHeader } from '../shared/SectionHeader';
import { NationDrawPicker } from './NationDrawPicker';
import { MAX_TEAMS } from '@/config/constants';

interface AuctionSetupProps {
  leagueData: Manager[];
  onTeamAdded: () => void;
  onStarted: () => void;
}

export function AuctionSetup({ leagueData, onStarted }: AuctionSetupProps) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/auction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCount: leagueData.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start auction');
      onStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start auction');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
      <PageHeader
        kicker="WC26 · Pre-auction"
        title="Auction Setup"
        subtitle="Add your franchises, pick nations and players, then go live."
        icon={<Users className="w-4 h-4" />}
        meta={
          <p className="fifa-stat-label mt-3">
            <span className="fifa-stat-value text-white">{leagueData.length}</span> / {MAX_TEAMS} franchises added
          </p>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 fifa-card backdrop-blur-sm rounded-sm p-6 flex flex-col gap-4">
          <SectionHeader title="Franchises" icon={<Users className="w-4 h-4" />} />
          <p className="text-[13px] text-[#888]">
            Teams are created by players in the{' '}
            <a href="/auction/lobby" className="text-[#00A94F] hover:underline">
              lobby
            </a>
            . They&apos;ll appear here as people join.
          </p>

          {leagueData.length > 0 ? (
            <ul className="flex flex-col gap-2 mt-1 border-t border-[#00A94F]/10 pt-4">
              {leagueData.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between py-2 border-b border-[#00A94F]/10 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-display font-bold uppercase tracking-wide text-white truncate">
                      {team.teamName}
                    </p>
                    <p className="fifa-stat-label">{team.name}</p>
                  </div>
                  <span className="fifa-stat-value text-[#E5A93D] text-[13px] shrink-0 ml-3">
                    ${team.budgetTotal}M
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#666] border border-dashed border-white/[0.12] rounded-sm px-3 py-4 text-center">
              No teams yet — waiting for players to create them in the lobby.
            </p>
          )}
        </section>

        <section className="lg:col-span-7 fifa-card backdrop-blur-sm rounded-sm p-6 flex flex-col gap-4">
          <SectionHeader title="Draw pool" accent="gold" />
          <NationDrawPicker mode="setup" />
        </section>
      </div>

      <div className="fifa-card rounded-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="fifa-section-title text-[16px]">Ready to go live?</p>
          <p className="fifa-subtitle mt-1 text-[13px]">
            Saves your franchises and draw pool, then switches to auction in progress.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStart}
          disabled={starting || leagueData.length === 0}
          className="shrink-0 flex items-center gap-2 text-[13px] font-display font-bold uppercase tracking-wide px-6 py-3 rounded-sm border border-[#00A94F]/35 bg-[#00A94F]/20 text-[#00A94F] hover:bg-[#00A94F]/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {starting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {starting ? 'Starting…' : 'Save & start auction'}
        </button>
      </div>

      {error && (
        <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-sm px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}
