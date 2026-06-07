import { DEFAULT_BUDGET_M, PLACEHOLDER_SLOT_COST_M } from '../config/constants';
import type { Manager } from '../types';

/** Remaining budget in millions */
export function getBudgetRemainingM(manager: Manager): number {
  const cap = manager.budgetTotal ?? DEFAULT_BUDGET_M;
  const spent = manager.roster.reduce((sum, p) => sum + (p.price ?? 0), 0);
  if (spent > 0) {
    return Math.max(0, cap - spent);
  }
  return cap - manager.squadCount * PLACEHOLDER_SLOT_COST_M;
}
