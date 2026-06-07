'use client';

import { ReactNode } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface LeagueGateProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
  emptyHint?: string;
  children: ReactNode;
}

export function LeagueGate({ loading, error, isEmpty, onRetry, emptyHint, children }: LeagueGateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 text-white/60">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        <p className="text-[14px] font-mono uppercase tracking-widest">Loading league</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 max-w-md mx-auto text-center px-6">
        <AlertCircle className="w-10 h-10 text-red-400/80" />
        <p className="text-[15px] text-[#EDEDED] font-medium">Could not load league</p>
        <p className="text-[13px] text-[#888] leading-relaxed">{error}</p>
        <button
          onClick={onRetry}
          className="mt-2 text-[13px] font-medium px-4 py-2 rounded-md bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-3 max-w-md mx-auto text-center px-6">
        <p className="text-[15px] text-[#EDEDED] font-medium">No franchises yet</p>
        <p className="text-[13px] text-[#888] leading-relaxed">
          {emptyHint ?? (
            <>
              Add rows to the <span className="font-mono text-white/70">teams</span> table in Supabase, then assign players in <span className="font-mono text-white/70">players</span>.
            </>
          )}
        </p>
        <button
          onClick={onRetry}
          className="mt-2 text-[13px] font-medium px-4 py-2 rounded-md bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
