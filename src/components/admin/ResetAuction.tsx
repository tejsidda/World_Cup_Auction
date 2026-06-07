'use client';

import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function notifyAuctionReset() {
  window.dispatchEvent(new Event('auction:reset'));
}

interface ResetAuctionProps {
  onReset?: () => void;
}

export function ResetAuction({ onReset }: ResetAuctionProps) {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleReset() {
    setResetting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/auction/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Reset failed');
      setResult(
        `Reset complete — ${data.poolReset} pool rows restored, ${data.rostersCleared} roster players removed.`
      );
      setConfirming(false);
      notifyAuctionReset();
      onReset?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-[#888] leading-relaxed">
        Undo auction progress: clears the current lot, marks all pool players as available again,
        removes every player from franchise rosters, and returns the auction room to setup mode.
        Franchises are kept — reconfigure nations and hit Save and start auction when ready.
      </p>

      {error && (
        <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {result && (
        <p className="text-[13px] text-[#00A94F] border border-[#00A94F]/20 bg-[#00A94F]/5 rounded-lg px-4 py-3">
          {result}
        </p>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="self-start flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15"
        >
          <RotateCcw className="w-4 h-4" />
          Reset auction
        </button>
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
          <p className="text-[13px] text-red-300 font-medium">
            This cannot be undone. Reset the entire auction?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className={cn(
                'flex items-center gap-2 text-[12px] font-medium px-4 py-2 rounded-md',
                'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-50'
              )}
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Yes, reset everything
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={resetting}
              className="text-[12px] font-medium px-4 py-2 rounded-md border border-white/[0.08] text-[#888] hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
