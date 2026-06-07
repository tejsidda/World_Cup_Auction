'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SoldRecord } from '@/types/auction';
import { SquadJersey } from '@/components/fifa/SquadJersey';

export function RecentlySold() {
  const [sales, setSales] = useState<SoldRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/auction/recent-sales?limit=8');
      const data = await res.json();
      setSales(data.sales ?? []);
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Expose refresh via custom event so parent can trigger after sell
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('auction:sold', handler);
    return () => window.removeEventListener('auction:sold', handler);
  }, [load]);

  if (loading) {
    return <p className="text-[13px] text-[#666]">Loading…</p>;
  }

  if (sales.length === 0) {
    return <p className="text-[13px] text-[#666]">No sales yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-0 divide-y divide-white/[0.05]">
      {sales.map((s) => (
        <li key={s.id} className="py-3 first:pt-0 last:pb-0 flex gap-2.5">
          <SquadJersey
            squadId={s.squadId}
            countryAbbr={s.countryAbbr}
            size="sm"
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-display font-bold uppercase tracking-wide text-white/90 truncate">{s.playerName}</p>
            <p className="fifa-stat-label mt-0.5">
              {s.countryAbbr} · {s.position}
            </p>
            <p className="text-[#00A94F] fifa-stat-value text-[14px] mt-1">
              ${s.priceM}M → {s.teamName}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function notifySaleRecorded() {
  window.dispatchEvent(new Event('auction:sold'));
}
