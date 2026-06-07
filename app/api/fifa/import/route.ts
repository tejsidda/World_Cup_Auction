import { NextResponse } from 'next/server';
import { importFifaPool } from '@/lib/db/pool-repository';

export async function POST() {
  try {
    const result = await importFifaPool();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
