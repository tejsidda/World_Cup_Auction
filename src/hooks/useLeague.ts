import { useState, useEffect, useCallback } from 'react';
import { fetchLeague } from '../lib/db/league-repository';
import { isSupabaseConfigured, SUPABASE_SETUP_HINT } from '../lib/env';
import { isTimeoutError, SUPABASE_TIMEOUT_MESSAGE } from '../lib/supabase/fetch';
import type { Manager } from '../types';

function formatLoadError(err: unknown): string {
  if (isTimeoutError(err)) return SUPABASE_TIMEOUT_MESSAGE;
  if (err instanceof Error) return err.message;
  return 'Failed to load league data';
}

export function useLeague() {
  const [leagueData, setLeagueData] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(SUPABASE_SETUP_HINT);
      setLeagueData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchLeague();
      setLeagueData(data);
    } catch (err) {
      setError(formatLoadError(err));
      setLeagueData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetch FIFA stats → update roster points → reload league */
  const syncStandings = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(SUPABASE_SETUP_HINT);
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/fifa/sync-points', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? 'Points sync failed');
      }
      const data = await fetchLeague();
      setLeagueData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync points';
      setError(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    leagueData,
    loading,
    syncing,
    error,
    reload,
    syncStandings,
    isConfigured: isSupabaseConfigured(),
  };
}
