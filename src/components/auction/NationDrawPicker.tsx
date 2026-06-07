'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { NationDrawRule, PoolNation } from '@/types/auction';
import { cn } from '@/lib/utils';
import { SquadFlag } from '@/components/fifa/SquadFlag';
import { NationPlayerPicker } from './NationPlayerPicker';

interface NationDrawPickerProps {
  mode: 'setup' | 'live';
}

export function NationDrawPicker({ mode }: NationDrawPickerProps) {
  const [nations, setNations] = useState<PoolNation[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [drawRules, setDrawRules] = useState<Record<string, NationDrawRule>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pickerCountry, setPickerCountry] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nationsRes, settingsRes] = await Promise.all([
        fetch('/api/pool/nations'),
        fetch('/api/auction/draw-settings'),
      ]);

      let nationsData: PoolNation[] | { error?: string };
      let settingsData: { drawCountries?: string[]; drawRules?: Record<string, NationDrawRule>; error?: string };

      try {
        nationsData = await nationsRes.json();
        settingsData = await settingsRes.json();
      } catch {
        throw new Error('Could not read server response');
      }

      if (!nationsRes.ok || !Array.isArray(nationsData)) {
        const msg =
          !Array.isArray(nationsData) && nationsData.error
            ? nationsData.error
            : 'Could not load nations';
        throw new Error(msg);
      }

      if (!settingsRes.ok || settingsData.error) {
        throw new Error(settingsData.error ?? 'Could not load draw settings');
      }

      setNations(nationsData);
      setSelectedCountries(settingsData.drawCountries ?? []);
      setDrawRules(settingsData.drawRules ?? {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load draw pool';
      setLoadError(message);
      setNations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleConfirmNation(abbr: string, rule: NationDrawRule) {
    setSelectedCountries((prev) => (prev.includes(abbr) ? prev : [...prev, abbr]));
    setDrawRules((prev) => ({ ...prev, [abbr]: rule }));
    setSaveMsg(null);
  }

  function handleRemoveNation(abbr: string) {
    setSelectedCountries((prev) => prev.filter((c) => c !== abbr));
    setDrawRules((prev) => {
      const next = { ...prev };
      delete next[abbr];
      return next;
    });
    setSaveMsg(null);
  }

  async function saveSettings() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/auction/draw-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawCountries: selectedCountries, drawRules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setSaveMsg('Draw pool saved');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const selectedSet = new Set(selectedCountries);
  const poolSize = nations
    .filter((n) => selectedSet.has(n.abbr))
    .reduce((sum, n) => {
      const rule = drawRules[n.abbr];
      if (!rule || rule.mode === 'whole') return sum + n.available;
      return sum + rule.playerIds.length;
    }, 0);

  if (loading) {
    return <p className="text-[13px] text-[#666]">Loading nations…</p>;
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
          {loadError}
        </p>
        <p className="text-[12px] text-[#666] leading-relaxed">
          The app could not reach Supabase. Check your project is not paused,{' '}
          <span className="font-mono text-white/50">.env.local</span> URL/key are correct,
          and your network can reach supabase.co — then retry.
        </p>
        <button
          type="button"
          onClick={() => load()}
          className="text-[12px] text-[#00A94F] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-[#888] leading-relaxed">
        Tap a nation to pick players or add the whole squad. Save before drawing.
      </p>

      <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {nations.map((n) => {
          const isOn = selectedSet.has(n.abbr);
          return (
            <button
              key={n.abbr}
              type="button"
              onClick={() => setPickerCountry(n.abbr)}
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-display font-semibold px-2.5 py-1.5 rounded-sm border transition-colors uppercase tracking-wide',
                isOn
                  ? 'bg-[#00A94F]/15 border-[#00A94F]/40 text-[#00A94F]'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#888] hover:text-white hover:border-[#00A94F]/20'
              )}
            >
              <SquadFlag abbr={n.abbr} size="sm" />
              {n.abbr}
            </button>
          );
        })}
      </div>

      <div className="fifa-stat-label">
        {selectedCountries.length} nations · {poolSize} in draw pool
      </div>

      {saveMsg && (
        <p className={cn('text-[12px]', saveMsg.includes('failed') || saveMsg.includes('Save failed') ? 'text-red-400' : 'text-[#00A94F]')}>
          {saveMsg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-sm border border-[#00A94F]/20 bg-[#00A94F]/10 hover:bg-[#00A94F]/15 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {mode === 'setup' ? 'Save pool' : 'Update pool'}
        </button>
      </div>

      <NationPlayerPicker
        countryAbbr={pickerCountry}
        existingRule={pickerCountry ? drawRules[pickerCountry] : undefined}
        onClose={() => setPickerCountry(null)}
        onConfirm={handleConfirmNation}
        onRemove={handleRemoveNation}
      />
    </div>
  );
}
