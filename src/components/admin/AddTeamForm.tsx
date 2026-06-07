'use client';

import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2 } from 'lucide-react';
import { DEFAULT_BUDGET_M, MAX_TEAMS } from '../../config/constants';
import { createTeam } from '../../lib/db/teams-repository';
import { cn } from '../../lib/utils';

interface AddTeamFormProps {
  teamCount: number;
  onSuccess: () => void;
}

export function AddTeamForm({ teamCount, onSuccess }: AddTeamFormProps) {
  const [managerName, setManagerName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [budgetTotal, setBudgetTotal] = useState(String(DEFAULT_BUDGET_M));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const atCapacity = teamCount >= MAX_TEAMS;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (atCapacity) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const budget = parseFloat(budgetTotal);
      if (Number.isNaN(budget) || budget <= 0) {
        throw new Error('Budget must be a positive number.');
      }

      await createTeam({
        managerName,
        teamName,
        budgetTotal: budget,
      });

      const addedName = teamName.trim();
      setManagerName('');
      setTeamName('');
      setBudgetTotal(String(DEFAULT_BUDGET_M));
      setSuccess(`Added "${addedName}" successfully.`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">Manager name</span>
          <input
            type="text"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="Alex Mercer"
            required
            disabled={atCapacity || submitting}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">Franchise name</span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Neon Galacticos"
            required
            disabled={atCapacity || submitting}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 sm:max-w-xs">
        <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">Budget (millions)</span>
        <input
          type="number"
          min={1}
          step={0.5}
          value={budgetTotal}
          onChange={(e) => setBudgetTotal(e.target.value)}
          disabled={atCapacity || submitting}
          className={inputClass}
        />
      </label>

      {atCapacity && (
        <p className="text-[13px] text-[#E5A93D] border border-[#E5A93D]/20 bg-[#E5A93D]/5 rounded-lg px-4 py-3">
          League is at capacity ({MAX_TEAMS} teams). Delete a team from the list to add more.
        </p>
      )}

      {error && (
        <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
          {error}
          {error.includes('policy') || error.includes('permission') ? (
            <span className="block mt-1 text-[#888] text-[12px]">
              Run <span className="font-mono text-white/70">supabase/migrations/002_teams_admin_insert.sql</span> in Supabase SQL Editor.
            </span>
          ) : null}
        </p>
      )}

      {success && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[13px] text-[#00A94F] border border-[#00A94F]/20 bg-[#00A94F]/5 rounded-lg px-4 py-3"
        >
          {success}
        </motion.p>
      )}

      <button
        type="submit"
        disabled={atCapacity || submitting}
        className={cn(
          'group relative overflow-hidden self-start text-[13px] font-medium text-[#EDEDED]',
          'bg-white/[0.04] border border-white/[0.08] px-5 py-2.5 rounded-md',
          'flex items-center gap-2 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:border-white/[0.15]'
        )}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {submitting ? 'Adding…' : 'Add team'}
      </button>
    </form>
  );
}

const inputClass =
  'w-full bg-black/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-white/[0.2] focus:bg-white/[0.03] transition-colors disabled:opacity-50';
