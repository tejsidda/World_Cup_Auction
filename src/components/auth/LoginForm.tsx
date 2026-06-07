'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, Mail, UserPlus } from 'lucide-react';
import { getAuthSupabase } from '@/lib/supabase/auth-client';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  nextPath: string;
}

type AuthMode = 'sign-in' | 'sign-up' | 'magic-link';

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetErrors() {
    setError(null);
    setSent(false);
  }

  async function handlePasswordSignIn(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    resetErrors();

    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        throw new Error('Enter email and password');
      }

      const supabase = getAuthSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) throw signInError;
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    resetErrors();

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const name = displayName.trim();

      if (!trimmedEmail || !password) {
        throw new Error('Enter email and password');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const supabase = getAuthSupabase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { display_name: name || trimmedEmail.split('@')[0] },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    resetErrors();

    try {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) throw new Error('Enter your email address');

      const supabase = getAuthSupabase();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });

      if (signInError) throw signInError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send login link');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent && mode === 'sign-up') {
    return (
      <div className="fifa-card backdrop-blur-md rounded-sm p-8 border-[#00A94F]/25 space-y-4">
        <p className="text-[15px] text-white/85 leading-relaxed">
          Account created. If email confirmation is enabled in Supabase, check your inbox
          first — then sign in with your password.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMode('sign-in');
          }}
          className="text-[13px] text-[#00A94F] hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (sent && mode === 'magic-link') {
    return (
      <div className="fifa-card backdrop-blur-md rounded-sm p-8 border-[#00A94F]/25 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#00A94F]/10 border border-[#00A94F]/25 text-[#00A94F] fifa-badge">
          <Mail className="w-3.5 h-3.5" />
          Check your email
        </div>
        <p className="text-[15px] text-white/85 leading-relaxed">
          Magic link sent to{' '}
          <span className="font-mono text-[#E5A93D]">{email.trim().toLowerCase()}</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMode('sign-in');
          }}
          className="text-[13px] text-white/50 hover:text-white transition-colors"
        >
          Use password instead
        </button>
      </div>
    );
  }

  return (
    <div className="fifa-card backdrop-blur-md rounded-sm p-8 border-[#00A94F]/25 space-y-5">
      <div className="flex p-0.5 bg-black/40 rounded-sm border border-[#00A94F]/15">
        {(
          [
            ['sign-in', 'Sign in'],
            ['sign-up', 'Create account'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              resetErrors();
            }}
            className={cn(
              'flex-1 py-2 text-[12px] font-display font-semibold uppercase tracking-wide rounded-sm transition-colors',
              mode === id
                ? 'bg-[#00A94F]/10 text-white border border-[#00A94F]/20'
                : 'text-white/45 hover:text-white'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-[#888] leading-relaxed">
        {mode === 'sign-up'
          ? 'Create your auction account once — then sign in with password on auction night.'
          : 'Email + password for the auction lobby. Faster than waiting on email links.'}
      </p>

      <form
        onSubmit={
          mode === 'sign-up'
            ? handleSignUp
            : mode === 'magic-link'
              ? handleMagicLink
              : handlePasswordSignIn
        }
        className="space-y-4"
      >
        {mode === 'sign-up' && (
          <label className="flex flex-col gap-2">
            <span className="fifa-stat-label">Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tejsi"
              autoComplete="name"
              disabled={submitting}
              className={inputClass}
            />
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="fifa-stat-label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={submitting}
            className={inputClass}
          />
        </label>

        {mode !== 'magic-link' && (
          <label className="flex flex-col gap-2">
            <span className="fifa-stat-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              disabled={submitting}
              className={inputClass}
            />
          </label>
        )}

        {error && (
          <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-sm text-[14px] font-display font-semibold uppercase tracking-wide',
            'bg-[#00A94F]/15 border border-[#00A94F]/40 text-[#00A94F]',
            'hover:bg-[#00A94F]/25 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === 'sign-up' ? (
            <UserPlus className="w-4 h-4" />
          ) : mode === 'magic-link' ? (
            <Mail className="w-4 h-4" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          {submitting
            ? 'Working…'
            : mode === 'sign-up'
              ? 'Create account'
              : mode === 'magic-link'
                ? 'Send magic link'
                : 'Sign in'}
        </button>
      </form>

      {mode !== 'magic-link' ? (
        <button
          type="button"
          onClick={() => {
            setMode('magic-link');
            resetErrors();
          }}
          className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
        >
          Prefer email magic link instead
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMode('sign-in');
            resetErrors();
          }}
          className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
        >
          Use password instead
        </button>
      )}
    </div>
  );
}

const inputClass =
  'w-full bg-black/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#00A94F]/40 disabled:opacity-50';
