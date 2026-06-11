'use client';

import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, UserPlus, Copy, Check, RefreshCw } from 'lucide-react';
import type { Manager } from '../../types';
import { DEFAULT_BUDGET_M } from '../../config/constants';
import { cn } from '../../lib/utils';

interface CreateUserFormProps {
  leagueData: Manager[];
  onCreated: () => void;
}

const TEAM_CAPACITY = 2;

type TeamMode = 'new' | 'existing' | 'none';

type CreatedAccount = {
  displayName: string;
  email: string;
  password: string;
  teamName: string | null;
};

function randomPassword(): string {
  // Friendly, easy-to-share password (no ambiguous characters).
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function CreateUserForm({ leagueData, onCreated }: CreateUserFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(randomPassword());
  const [teamMode, setTeamMode] = useState<TeamMode>('new');
  const [teamName, setTeamName] = useState('');
  const [budget, setBudget] = useState(String(DEFAULT_BUDGET_M));
  const [existingTeamId, setExistingTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [copied, setCopied] = useState(false);

  const joinableTeams = useMemo(
    () => leagueData.filter((t) => t.members.length < TEAM_CAPACITY),
    [leagueData]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreated(null);
    setCopied(false);

    try {
      let team:
        | { mode: 'new'; teamName: string; budgetTotal: number }
        | { mode: 'existing'; teamId: string }
        | { mode: 'none' };

      if (teamMode === 'new') {
        const b = parseFloat(budget);
        if (!teamName.trim()) throw new Error('Enter a team name');
        if (Number.isNaN(b) || b <= 0) throw new Error('Budget must be a positive number');
        team = { mode: 'new', teamName: teamName.trim(), budgetTotal: b };
      } else if (teamMode === 'existing') {
        if (!existingTeamId) throw new Error('Pick a team to add them to');
        team = { mode: 'existing', teamId: existingTeamId };
      } else {
        team = { mode: 'none' };
      }

      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, team }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not create the account');

      setCreated({
        displayName: data.user.displayName,
        email: data.user.email,
        password,
        teamName: data.user.teamName,
      });

      // Reset inputs for the next person, fresh password.
      setDisplayName('');
      setEmail('');
      setPassword(randomPassword());
      setTeamName('');
      setExistingTeamId('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyDetails() {
    if (!created) return;
    const lines = [
      `Login for ${created.displayName}${created.teamName ? ` (${created.teamName})` : ''}`,
      `Email: ${created.email}`,
      `Password: ${created.password}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; details are still shown on screen.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13px] text-[#888] leading-relaxed">
        Create a login for a friend (no email is sent), optionally put them on a team, then
        share the email + password so they can sign in and start bidding.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">
              Display name
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex"
              disabled={submitting}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">
              Email (their login)
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
              disabled={submitting}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 sm:max-w-sm">
          <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">
            Password
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              disabled={submitting}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setPassword(randomPassword())}
              disabled={submitting}
              title="Generate a new password"
              className="shrink-0 p-2.5 rounded-md border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:border-white/[0.15] disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </label>

        <div className="flex flex-col gap-3">
          <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">Team</span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['new', 'Create new team'],
                ['existing', 'Add to existing team'],
                ['none', 'No team yet'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTeamMode(id)}
                disabled={submitting}
                className={cn(
                  'px-3 py-1.5 rounded-sm text-[12px] font-display font-semibold uppercase tracking-wide border transition-colors disabled:opacity-50',
                  teamMode === id
                    ? 'bg-[#00A94F]/15 border-[#00A94F]/40 text-[#00A94F]'
                    : 'border-white/[0.1] bg-white/[0.03] text-white/45 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {teamMode === 'new' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">
                  Franchise name
                </span>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Neon Galacticos"
                  disabled={submitting}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">
                  Budget (millions)
                </span>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                />
              </label>
            </div>
          )}

          {teamMode === 'existing' && (
            <label className="flex flex-col gap-2 sm:max-w-sm">
              <span className="text-[11px] uppercase tracking-widest text-[#888] font-mono">
                Pick a team (slots open)
              </span>
              {joinableTeams.length > 0 ? (
                <select
                  value={existingTeamId}
                  onChange={(e) => setExistingTeamId(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                >
                  <option value="">Select a team…</option>
                  {joinableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.teamName} ({t.members.length}/{TEAM_CAPACITY})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[13px] text-[#E5A93D]">
                  No teams with open slots. Create a new team instead.
                </p>
              )}
            </label>
          )}
        </div>

        {error && (
          <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'self-start flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-md',
            'bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F]',
            'hover:bg-[#00A94F]/25 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {submitting ? 'Creating…' : 'Create login'}
        </button>
      </form>

      {created && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[#00A94F]/25 bg-[#00A94F]/5 p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] uppercase tracking-widest text-[#00A94F] font-mono">
              Account ready — share these
            </span>
            <button
              type="button"
              onClick={copyDetails}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-sm border border-[#00A94F]/30 text-[#00A94F] hover:bg-[#00A94F]/10"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-[13px] text-white/90 flex flex-col gap-1">
            <span>
              <span className="text-white/45">Name: </span>
              {created.displayName}
              {created.teamName ? (
                <span className="text-[#E5A93D]"> · {created.teamName}</span>
              ) : null}
            </span>
            <span>
              <span className="text-white/45">Email: </span>
              {created.email}
            </span>
            <span>
              <span className="text-white/45">Password: </span>
              {created.password}
            </span>
          </div>
          <p className="text-[12px] text-white/45">
            They sign in at the login page with these — no email confirmation needed.
          </p>
        </motion.div>
      )}
    </div>
  );
}

const inputClass =
  'w-full bg-black/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-white/[0.2] focus:bg-white/[0.03] transition-colors disabled:opacity-50';
