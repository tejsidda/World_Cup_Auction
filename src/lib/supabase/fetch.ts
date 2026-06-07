export const SUPABASE_DATA_FETCH_TIMEOUT_MS = 20_000;
export const SUPABASE_AUTH_FETCH_TIMEOUT_MS = 60_000;

export const SUPABASE_TIMEOUT_MESSAGE =
  'Could not reach Supabase (timed out). Check your network and that the project is not paused.';

function fetchWithTimeout(timeoutMs: number) {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const signal = init?.signal ?? AbortSignal.timeout(timeoutMs);
    return fetch(input, { ...init, signal });
  };
}

/** Data reads (league, pool, etc.) */
export const supabaseFetch = fetchWithTimeout(SUPABASE_DATA_FETCH_TIMEOUT_MS);

/** Auth token refresh / getUser — slower networks need more time */
export const authSupabaseFetch = fetchWithTimeout(SUPABASE_AUTH_FETCH_TIMEOUT_MS);

/** Check if an error (or error-like object) is a timeout / network failure. */
export function isTimeoutError(err: unknown): boolean {
  if (!err) return false;

  // Standard Error instances
  if (err instanceof Error) {
    return (
      err.name === 'TimeoutError' ||
      err.name === 'AbortError' ||
      err.message.includes('timed out') ||
      err.message.includes('fetch failed') ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('ConnectTimeoutError') ||
      err.message.includes('UND_ERR_CONNECT_TIMEOUT')
    );
  }

  // Supabase PostgrestError or other objects with .message
  if (typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: string }).message;
    return (
      msg.includes('timed out') ||
      msg.includes('fetch failed') ||
      msg.includes('Failed to fetch') ||
      msg.includes('ConnectTimeoutError') ||
      msg.includes('UND_ERR_CONNECT_TIMEOUT')
    );
  }

  return false;
}
