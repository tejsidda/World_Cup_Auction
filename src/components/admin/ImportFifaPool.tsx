'use client';

import { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ImportFifaPool() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleImport() {
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/fifa/import', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? 'Import failed');
      }
      setResult(
        `Imported ${body.imported} players — ${body.available} available, ${body.sold} sold.`
      );
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Import failed';
      if (message.includes('policy') || message.includes('pool_players')) {
        message += ' — run supabase/migrations/003_pool_players_fifa.sql';
      }
      setError(message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-[#888] leading-relaxed">
        Pull all WC26 fantasy players from FIFA into the auction pool (~1,480 players). Safe to re-run —
        sold players stay marked as sold.
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

      <button
        type="button"
        onClick={handleImport}
        disabled={importing}
        className={cn(
          'self-start flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-md',
          'bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15]',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {importing ? 'Importing from FIFA…' : 'Import FIFA player pool'}
      </button>
    </div>
  );
}
