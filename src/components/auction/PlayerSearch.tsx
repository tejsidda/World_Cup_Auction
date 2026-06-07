'use client';

import { useEffect, useState } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import type { PoolPlayer } from '@/types/auction';
import { cn } from '@/lib/utils';
import { SquadFlag } from '@/components/fifa/SquadFlag';

interface PlayerSearchProps {
  onCallUp: (fifaId: number) => Promise<void>;
  callingUp: number | null;
}

export function PlayerSearch({ onCallUp, callingUp }: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PoolPlayer[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/pool/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.players ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-[#888] leading-relaxed">
        Search any player by name — call them up even if their nation isn&apos;t in the draw.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Mbappé, Saka, Messi…"
          className="w-full bg-black/50 border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-white/[0.2]"
        />
      </div>

      {searching && (
        <p className="text-[12px] text-[#666] flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
        </p>
      )}

      {results.length > 0 && (
        <ul className="flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar border border-white/[0.06] rounded-lg divide-y divide-white/[0.04]">
          {results.map((p) => (
            <li key={p.fifaId} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/[0.03]">
              <div className="flex items-center gap-2.5 min-w-0">
                <SquadFlag abbr={p.countryAbbr} size="md" />
                <div className="min-w-0">
                  <p className="text-[13px] text-white truncate font-medium">{p.displayName}</p>
                  <p className="text-[11px] text-[#666] font-mono">
                    {p.countryAbbr} · {p.position}
                    {p.auctionStatus === 'on_block' && (
                      <span className="text-[#E5A93D] ml-1">· on block</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={p.auctionStatus === 'sold' || callingUp !== null}
                onClick={() => onCallUp(p.fifaId)}
                className={cn(
                  'shrink-0 flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-md border',
                  'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40'
                )}
              >
                {callingUp === p.fifaId ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <UserPlus className="w-3 h-3" />
                )}
                Call up
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-[12px] text-[#666]">No matches.</p>
      )}
    </div>
  );
}
