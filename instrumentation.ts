// Runs once when the Next.js server starts.
// Forces IPv4-first DNS resolution to avoid long hangs on networks with broken
// IPv6 (Node 17+ tries IPv6 first by default, which can stall every outbound
// fetch — including all Supabase calls — for ~10s+ per attempt).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns');
    dns.setDefaultResultOrder('ipv4first');
  }
}
