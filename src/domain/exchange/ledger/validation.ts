import Decimal from 'decimal.js';
import type { LedgerJournal } from './types';

export interface LedgerValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateLedgerJournal(journal: LedgerJournal): LedgerValidationResult {
  if (!journal.lines || journal.lines.length < 2) {
    return {
      valid: false,
      reason: '每条分录至少需要 2 条明细',
    };
  }

  const perAsset = new Map<string, Decimal>();
  for (const line of journal.lines) {
    if (!line.asset) {
      return { valid: false, reason: '分录资产不能为空' };
    }
    if (!line.account) {
      return { valid: false, reason: '分录账户不能为空' };
    }
    let delta: Decimal;
    try {
      delta = new Decimal(line.delta);
    } catch {
      return { valid: false, reason: '分录 delta 不是有效数值' };
    }
    perAsset.set(line.asset, (perAsset.get(line.asset) || new Decimal(0)).plus(delta));
  }

  for (const [asset, sum] of perAsset.entries()) {
    if (!sum.isZero()) {
      return {
        valid: false,
        reason: `资产 ${asset} 分录不平衡`,
      };
    }
  }

  return { valid: true };
}

export function assertLedgerJournal(journal: LedgerJournal): void {
  const result = validateLedgerJournal(journal);
  if (!result.valid) {
    throw new Error(result.reason || '账务分录校验失败');
  }
}
