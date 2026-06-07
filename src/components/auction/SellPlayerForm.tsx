'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { Manager } from '@/types';
import { SQUAD_SIZE } from '@/config/constants';
import { getBudgetRemainingM } from '@/lib/budget';
import { cn } from '@/lib/utils';
import { FranchisePicker } from './FranchisePicker';

interface SellPlayerFormProps {
  leagueData: Manager[];
  onSold: () => void;
}

export function SellPlayerForm({ leagueData, onSold }: SellPlayerFormProps) {
  const [teamId, setTeamId] = useState('');
  const [priceM, setPriceM] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTeam = useMemo(
    () => leagueData.find((m) => m.id === teamId),
    [leagueData, teamId]
  );

  const remaining = selectedTeam ? getBudgetRemainingM(selectedTeam) : null;
  const squadFull = selectedTeam ? selectedTeam.squadCount >= SQUAD_SIZE : false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const price = parseFloat(priceM);
      const res = await fetch('/api/auction/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, priceM: price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sale failed');

      setSuccess(`Sold to ${data.sale.teamName} for $${data.sale.priceM}M`);
      setPriceM('');
      setTeamId('');
      onSold();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (leagueData.length === 0) {
    return (
      <p className="text-[13px] text-[#666]">
        Add franchises in Admin before recording sales.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-[13px] text-[#888] leading-relaxed">
        After bidding on the call, pick the winning franchise and enter the hammer price.
      </p>

      <div className="flex flex-col gap-2">
        <span className="fifa-stat-label">Winning franchise</span>
        <FranchisePicker
          leagueData={leagueData}
          selectedId={teamId}
          onSelect={setTeamId}
          disabled={submitting}
        />
      </div>

      {selectedTeam && (
        <div className="text-[12px] font-mono text-[#666] flex gap-4">
          <span>
            Remaining:{' '}
            <span className="text-white">${remaining?.toFixed(1)}M</span>
          </span>
          <span>
            Squad:{' '}
            <span className={cn(squadFull ? 'text-red-400' : 'text-white')}>
              {selectedTeam.squadCount}/{SQUAD_SIZE}
            </span>
          </span>
        </div>
      )}

      <label className="flex flex-col gap-2 sm:max-w-xs">
        <span className="fifa-stat-label">
          Hammer price (millions)
        </span>
        <input
          type="number"
          min={0.1}
          step="any"
          value={priceM}
          onChange={(e) => setPriceM(e.target.value)}
          placeholder="12.5"
          required
          disabled={submitting || squadFull}
          className={inputClass}
        />
      </label>

      {error && (
        <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {success && (
        <p className="text-[13px] text-[#00A94F] border border-[#00A94F]/20 bg-[#00A94F]/5 rounded-lg px-4 py-3">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !teamId || squadFull}
        className={cn(
          'self-start flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-md',
          'bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F]',
          'hover:bg-[#00A94F]/25 disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        {submitting ? 'Recording…' : 'Mark sold'}
      </button>
    </form>
  );
}

const inputClass =
  'w-full bg-black/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-white/[0.2] disabled:opacity-50';

