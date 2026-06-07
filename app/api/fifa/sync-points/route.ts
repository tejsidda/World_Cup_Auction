import { NextResponse } from 'next/server';
import { syncRosterPointsFromFifa } from '@/lib/db/pool-repository';

export async function POST() {
  try {
    const result = await syncRosterPointsFromFifa();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Points sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
