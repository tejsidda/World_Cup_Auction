'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pencil, Trash2, Loader2, X, Check } from 'lucide-react';
import type { Manager } from '@/types';
import { deleteTeam, updateTeam } from '@/lib/db/teams-repository';
import { cn } from '@/lib/utils';

interface TeamAdminListProps {
  leagueData: Manager[];
  onChanged: () => void;
}

const inputClass =
  'w-full bg-black/50 border border-white/[0.08] rounded-sm px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#00A94F]/30 disabled:opacity-50';

export function TeamAdminList({ leagueData, onChanged }: TeamAdminListProps) {
  const [editingTeam, setEditingTeam] = useState<Manager | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (leagueData.length === 0) {
    return (
      <p className="text-[14px] text-[#666] py-8 text-center">
        No teams yet. Add your first franchise using the form.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-[#00A94F]/10">
        {leagueData.map((team, index) => (
          <li
            key={team.id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-3"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="text-[12px] fifa-stat-value text-[#666] w-6 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-display font-bold uppercase tracking-wide text-white truncate">
                  {team.teamName}
                </p>
                <p className="text-[13px] text-[#888] truncate">{team.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="fifa-stat-value text-[13px] text-[#E5A93D]">${team.budgetTotal}M</p>
                <p className="fifa-stat-label">{team.squadCount} players</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingTeam(team)}
                  className="p-2 rounded-sm border border-white/[0.08] text-white/50 hover:text-white hover:border-[#00A94F]/25 transition-colors"
                  aria-label={`Edit ${team.teamName}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmDeleteId(team.id);
                  }}
                  className="p-2 rounded-sm border border-white/[0.08] text-white/50 hover:text-red-400 hover:border-red-500/25 transition-colors"
                  aria-label={`Delete ${team.teamName}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <EditTeamModal
        team={editingTeam}
        onClose={() => setEditingTeam(null)}
        onSaved={() => {
          setEditingTeam(null);
          onChanged();
        }}
      />

      <ConfirmDeleteModal
        team={leagueData.find((t) => t.id === confirmDeleteId) ?? null}
        deleting={deletingId === confirmDeleteId}
        error={deleteError}
        onClose={() => {
          setConfirmDeleteId(null);
          setDeleteError(null);
        }}
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          setDeletingId(confirmDeleteId);
          setDeleteError(null);
          try {
            await deleteTeam(confirmDeleteId);
            setConfirmDeleteId(null);
            onChanged();
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Delete failed');
          } finally {
            setDeletingId(null);
          }
        }}
      />
    </>
  );
}

function EditTeamModal({
  team,
  onClose,
  onSaved,
}: {
  team: Manager | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [managerName, setManagerName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setManagerName(team.name);
      setTeamName(team.teamName);
      setBudgetTotal(String(team.budgetTotal));
      setError(null);
    }
  }, [team]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!team) return;
    setSubmitting(true);
    setError(null);
    try {
      const budget = parseFloat(budgetTotal);
      if (Number.isNaN(budget) || budget <= 0) {
        throw new Error('Budget must be a positive number.');
      }
      await updateTeam(team.id, { managerName, teamName, budgetTotal: budget });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {team && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.form
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onSubmit={handleSubmit}
            className="fixed inset-x-4 top-[15vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 fifa-card backdrop-blur-xl rounded-sm p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="fifa-section-title">Edit franchise</h3>
              <button type="button" onClick={onClose} className="p-1.5 rounded-sm border border-white/10 text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-2">
              <span className="fifa-stat-label">Manager name</span>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                required
                disabled={submitting}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="fifa-stat-label">Franchise name</span>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                disabled={submitting}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="fifa-stat-label">Budget (millions)</span>
              <input
                type="number"
                min={1}
                step={0.5}
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                required
                disabled={submitting}
                className={inputClass}
              />
            </label>

            {error && (
              <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-sm px-3 py-2">
                {error}
                {error.includes('policy') || error.includes('permission') ? (
                  <span className="block mt-1 text-[#888] text-[12px]">
                    Run <span className="font-mono text-white/70">supabase/migrations/008_teams_update_delete.sql</span> in Supabase SQL Editor.
                  </span>
                ) : null}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-sm border border-white/10 text-white/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-sm border border-[#00A94F]/30 bg-[#00A94F]/15 text-[#00A94F] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save changes
              </button>
            </div>
          </motion.form>
        </>
      )}
    </AnimatePresence>
  );
}

function ConfirmDeleteModal({
  team,
  deleting,
  error,
  onClose,
  onConfirm,
}: {
  team: Manager | null;
  deleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {team && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="fixed inset-x-4 top-[25vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm z-50 fifa-card backdrop-blur-xl rounded-sm p-6 flex flex-col gap-4"
          >
            <h3 className="fifa-section-title text-red-400">Delete franchise?</h3>
            <p className="text-[14px] text-[#888] leading-relaxed">
              Remove <span className="text-white font-medium">{team.teamName}</span>?
              {team.squadCount > 0 && (
                <span className="block mt-2 text-[#E5A93D]">
                  This team has {team.squadCount} rostered player{team.squadCount === 1 ? '' : 's'} — they will be removed too.
                </span>
              )}
            </p>
            {error && (
              <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-sm px-3 py-2">
                {error}
                {error.includes('policy') || error.includes('permission') ? (
                  <span className="block mt-1 text-[#888] text-[12px]">
                    Run <span className="font-mono text-white/70">supabase/migrations/008_teams_update_delete.sql</span> in Supabase SQL Editor.
                  </span>
                ) : null}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-sm border border-white/10 text-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={deleting}
                className={cn(
                  'flex items-center gap-2 text-[12px] font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-sm',
                  'border border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50'
                )}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
