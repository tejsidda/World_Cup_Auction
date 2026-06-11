'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { PointsTable } from '@/components/PointsTable';
import { TeamsBoard } from '@/components/TeamsBoard';
import { PlayersPortfolio } from '@/components/PlayersPortfolio';
import { AuctionRoomSection } from '@/components/auction/AuctionRoomSection';
import { AdminPage } from '@/components/admin/AdminPage';
import { useLeague } from '@/hooks/useLeague';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { LeagueGate } from '@/components/LeagueGate';
import type { ViewState } from '@/types/app';

const WC26GeometryCanvas = dynamic(() => import('@/components/WC26GeometryCanvas'), {
  ssr: false,
});

const AuctionSmokeCanvas = dynamic(() => import('@/components/AuctionSmokeCanvas'), {
  ssr: false,
});

const NAV_TABS = [
  { id: 'points-table' as const, label: 'Standings', shortLabel: 'Standings' },
  { id: 'teams' as const, label: 'Franchises', shortLabel: 'Teams' },
  { id: 'auction' as const, label: 'Auction Room', shortLabel: 'Auction' },
];

function isTabActive(view: ViewState, tabId: (typeof NAV_TABS)[number]['id']) {
  return view === tabId || (tabId === 'teams' && view === 'players');
}

function VercelGridBg({ viewState }: { viewState: ViewState }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex justify-center overflow-hidden h-full content-background">
      {viewState === 'auction' ? <AuctionSmokeCanvas /> : <WC26GeometryCanvas />}
      <div className="w-[100vw] max-w-[1200px] h-full relative border-x border-[#00A94F]/[0.08]">
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-[#00A94F]/[0.04]" />
        <div className="absolute top-0 bottom-0 left-2/4 w-px bg-[#00A94F]/[0.04]" />
        <div className="absolute top-0 bottom-0 left-3/4 w-px bg-[#00A94F]/[0.04]" />
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-[#00A94F]/[0.04]"
            style={{ top: `${(i + 1) * 100}px` }}
          />
        ))}
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.04] blur-[120px] rounded-[100%]" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const [view, setView] = useState<ViewState>('points-table');
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const { leagueData, loading, syncing, error, reload, syncStandings, isConfigured } = useLeague();
  const { isAdmin, loading: authLoading } = useAdminAccess();

  useEffect(() => {
    if (!authLoading && view === 'admin' && !isAdmin) {
      setView('points-table');
    }
  }, [authLoading, view, isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('view');
    const allowed: ViewState[] = ['points-table', 'teams', 'auction'];
    if (requested && allowed.includes(requested as ViewState)) {
      setView(requested as ViewState);
    }
  }, []);

  const handleSelectTeam = (managerId: string) => {
    setSelectedManagerId(managerId);
    setView('players');
  };

  const handleBackToTeams = () => {
    setView('teams');
    setSelectedManagerId(null);
  };

  return (
    <div className="min-h-screen bg-[#000] text-[#EDEDED] overflow-hidden selection:bg-white/20 selection:text-white font-sans relative flex flex-col items-center">
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      <VercelGridBg viewState={view} />
      <nav className="relative z-20 sticky top-0 w-full border-b border-[#00A94F]/15 bg-black/70 backdrop-blur-xl">
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            <motion.div
              whileHover={{ opacity: 0.8 }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
              onClick={() => {
                setView('points-table');
                setSelectedManagerId(null);
              }}
            >
              <Image
                src="https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill&quality=75"
                alt="WC26 Logo"
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain rounded-sm"
                priority
              />
              <h1 className="font-display font-bold uppercase text-[15px] sm:text-[17px] tracking-[0.12em] text-white hidden sm:block">
                WC26 Fantasy
              </h1>
            </motion.div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => syncStandings()}
                disabled={loading || syncing}
                aria-label={syncing ? 'Syncing standings' : 'Refresh standings'}
                className="group relative overflow-hidden text-[12px] sm:text-[13px] font-medium text-[#EDEDED] transition-colors bg-white/[0.04] border border-white/[0.08] p-2 sm:px-3 sm:py-1.5 rounded-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/[0.08] translate-y-[200%] rotate-[15deg] scale-[1.8] transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1.08,0.38,0.98)] group-hover:translate-y-0 group-hover:rotate-0 group-hover:scale-100 z-0" />
                <RefreshCw className={`relative z-10 w-4 h-4 sm:hidden ${syncing ? 'animate-spin' : ''}`} />
                <span className="relative z-10 hidden sm:inline group-hover:text-white transition-colors duration-300">
                  {syncing ? 'Syncing…' : 'Refresh Standings'}
                </span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setView('admin');
                    setSelectedManagerId(null);
                  }}
                  className={`text-[11px] sm:text-[13px] font-display font-semibold uppercase tracking-wide px-2.5 sm:px-3 py-1.5 rounded-sm border transition-colors ${
                    view === 'admin'
                      ? 'bg-[#00A94F]/10 border-[#00A94F]/25 text-white'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:border-white/[0.12]'
                  }`}
                >
                  Admin
                </button>
              )}
              <a
                href="/auction/lobby"
                className="text-[11px] sm:text-[13px] font-display font-semibold uppercase tracking-wide px-2.5 sm:px-3 py-1.5 rounded-sm border bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:border-white/[0.12] transition-colors"
              >
                Lobby
              </a>
              <div className="hidden sm:flex p-0.5 bg-black/40 rounded-sm border border-[#00A94F]/15">
                {NAV_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setView(tab.id);
                      setSelectedManagerId(null);
                    }}
                    className="relative flex items-center px-4 py-1.5 text-[13px] rounded-sm transition-colors z-10 group outline-none font-display font-semibold uppercase tracking-wide"
                  >
                    {isTabActive(view, tab.id) && (
                      <motion.div
                        layoutId="active-tab-desktop"
                        className="absolute inset-0 bg-[#00A94F]/10 rounded-sm border border-[#00A94F]/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span
                      className={`relative z-10 transition-colors duration-300 ${isTabActive(view, tab.id) ? 'text-white' : 'text-white/50 group-hover:text-white'}`}
                    >
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sm:hidden pb-3">
            <div className="flex p-0.5 bg-black/40 rounded-sm border border-[#00A94F]/15">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setView(tab.id);
                    setSelectedManagerId(null);
                  }}
                  className="relative flex-1 flex items-center justify-center py-2 text-[11px] rounded-sm transition-colors z-10 group outline-none font-display font-semibold uppercase tracking-wide"
                >
                  {isTabActive(view, tab.id) && (
                    <motion.div
                      layoutId="active-tab-mobile"
                      className="absolute inset-0 bg-[#00A94F]/10 rounded-sm border border-[#00A94F]/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors duration-300 ${isTabActive(view, tab.id) ? 'text-white' : 'text-white/50 group-hover:text-white'}`}
                  >
                    {tab.shortLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1200px] w-full px-4 sm:px-6 py-12 pb-24 h-full">
        {view === 'admin' && isAdmin ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            {!isConfigured && (
              <div className="mb-6 text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
                Supabase is not configured. Add{' '}
                <span className="font-mono">NEXT_PUBLIC_SUPABASE_*</span> to{' '}
                <span className="font-mono">.env.local</span> (or Vercel env vars) and restart.
              </div>
            )}
            <AdminPage leagueData={leagueData} onTeamAdded={() => reload()} />
          </motion.div>
        ) : view === 'auction' ? (
          <motion.div
            key="auction"
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)', y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            <AuctionRoomSection leagueData={leagueData} onSold={reload} isAdmin={isAdmin} />
          </motion.div>
        ) : (
          <LeagueGate
            loading={loading}
            error={error}
            isEmpty={!loading && !error && leagueData.length === 0}
            onRetry={() => reload()}
            emptyHint="No franchises yet. Open Auction to add your first team."
          >
            <AnimatePresence mode="wait">
              {view === 'points-table' && (
                <motion.div
                  key="points-table"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                >
                  <PointsTable leagueData={leagueData} />
                </motion.div>
              )}

              {(view === 'teams' || view === 'players') && (
                <motion.div
                  key="teams"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)', y: -10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                >
                  <TeamsBoard leagueData={leagueData} onSelectTeam={handleSelectTeam} />
                </motion.div>
              )}

            </AnimatePresence>
          </LeagueGate>
        )}
      </main>

      <AnimatePresence>
        {view === 'players' && selectedManagerId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={handleBackToTeams}
            />
            <motion.div
              key="players-drawer"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 bottom-0 right-0 w-full sm:w-[500px] lg:w-[600px] xl:w-[800px] bg-black/80 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 sm:p-6 lg:p-8">
                <PlayersPortfolio
                  managerId={selectedManagerId}
                  leagueData={leagueData}
                  onBack={handleBackToTeams}
                  isAdmin={isAdmin}
                  onReplaced={() => reload()}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
