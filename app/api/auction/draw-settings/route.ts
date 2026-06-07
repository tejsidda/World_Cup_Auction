import { NextResponse } from 'next/server';
import { requireAdmin, isAuthedContext } from '@/lib/auth/require-user';
import { getDrawSettings, saveDrawSettings } from '@/lib/db/auction-repository';
import type { NationDrawRule } from '@/types/auction';

function parseDrawRulesInput(raw: unknown): Record<string, NationDrawRule> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const rules: Record<string, NationDrawRule> = {};
  for (const [abbr, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const rule = value as { mode?: string; playerIds?: unknown };
    if (rule.mode === 'whole') {
      rules[abbr] = { mode: 'whole' };
    } else if (rule.mode === 'pick' && Array.isArray(rule.playerIds)) {
      const playerIds = rule.playerIds.filter((id): id is number => typeof id === 'number');
      if (playerIds.length > 0) rules[abbr] = { mode: 'pick', playerIds };
    }
  }
  return rules;
}

export async function GET() {
  try {
    const settings = await getDrawSettings();
    return NextResponse.json(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load draw settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const ctx = await requireAdmin();
  if (!isAuthedContext(ctx)) return ctx;

  try {
    const body = await request.json();
    const drawCountries = Array.isArray(body.drawCountries)
      ? body.drawCountries.filter((c: unknown) => typeof c === 'string')
      : [];
    const drawRules = parseDrawRulesInput(body.drawRules);
    const settings = await saveDrawSettings(drawCountries, drawRules);
    return NextResponse.json(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save draw settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
