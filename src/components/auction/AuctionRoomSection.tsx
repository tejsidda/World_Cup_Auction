'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogIn } from 'lucide-react';
import type { Manager } from '@/types';
import { AuctionRoom } from '@/components/AuctionRoom';
import { AuctionWatch } from '@/components/auction/AuctionWatch';
import { PageHeader } from '@/components/shared/PageHeader';
import type { SessionState } from '@/types/session';

const POLL_INTERVAL_MS = 4000;

type LoadStatus = 'loading' | 'unauthed' | 'ready' | 'error';

interface AuctionRoomSectionProps {
  leagueData: Manager[];
  onSold?: () => void;
  isAdmin: boolean;
}

export function AuctionRoomSection({ leagueData, onSold, isAdmin }: AuctionRoomSectionProps) {
  const [state, setState] = useState<SessionState | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/session/state', { cache: 'no-store' });
      if (res.status === 401) {
        setStatus('unauthed');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load auction');
      setState(data.state);
      setStatus('ready');
    } catch (err) {
      if (firstLoad.current) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not load auction');
        setStatus('error');
      }
    } finally {
      firstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[240px] text-[#666] text-[14px] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading auction room…
      </div>
    );
  }

  if (status === 'unauthed') {
    return (
      <div className="space-y-6">
        <PageHeader kicker="WC26 · Auction" title="Auction Room" />
        <div className="fifa-card rounded-sm p-8 border border-white/[0.08] text-center space-y-4">
          <p className="text-[15px] text-white/80">Sign in to join the auction.</p>
          <Link
            href="/login?next=/auction/lobby"
            className="inline-flex items-center gap-2 text-[13px] font-display font-semibold uppercase tracking-wide px-5 py-2.5 rounded-sm bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F] hover:bg-[#00A94F]/25"
          >
            <LogIn className="w-4 h-4" /> Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error' || !state) {
    return (
      <div className="fifa-card rounded-sm p-6 border border-red-500/20 bg-red-500/5 text-[13px] text-red-400">
        {errorMsg ?? 'Could not load the auction room.'}
        <button onClick={() => load()} className="ml-3 underline text-white/70">
          Retry
        </button>
      </div>
    );
  }

  // Admin always sees the full console (setup → start → draw → sell).
  // Starting the auction there flips the session live for everyone else.
  if (isAdmin) {
    return <AuctionRoom leagueData={leagueData} onSold={onSold} />;
  }

  // Players: wait until the admin starts, then watch the block read-only.
  if (state.status === 'live') {
    return (
      <AuctionWatch leagueData={leagueData} myTeamId={state.myTeamId} onResolved={onSold} />
    );
  }

  return <WaitingCard />;
}

function WaitingCard() {
  return (
    <div className="space-y-6">
      <PageHeader kicker="WC26 · Auction" title="Auction Room" />
      <div className="fifa-card rounded-sm p-10 border border-white/[0.08] text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center border bg-white/[0.04] border-white/[0.1] text-white/50">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <h3 className="fifa-headline text-[22px] text-white">Waiting for the admin to start</h3>
        <p className="text-[14px] text-[#888] max-w-sm mx-auto">
          You&apos;re in. The auction will begin once the host starts it. This screen updates
          automatically.
        </p>
        <Link
          href="/auction/lobby"
          className="inline-flex items-center gap-2 text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-sm border border-white/[0.1] bg-white/[0.04] text-white/60 hover:text-white"
        >
          Back to lobby
        </Link>
      </div>
    </div>
  );
}
