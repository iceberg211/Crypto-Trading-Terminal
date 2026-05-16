import { describe, expect, it } from 'vitest';
import { validateLedgerJournal } from '@/domain/exchange/ledger/validation';
import type { LedgerJournal } from '@/domain/exchange/ledger/types';

function baseJournal(lines: LedgerJournal['lines']): LedgerJournal {
  return {
    journalId: 'j1',
    flowId: 'f1',
    orderId: 1,
    symbol: 'BTCUSDT',
    side: 'BUY',
    kind: 'LOCK',
    timestamp: Date.now(),
    lines,
  };
}

describe('ledger validation', () => {
  it('拒绝不平衡分录', () => {
    const result = validateLedgerJournal(
      baseJournal([
        { lineId: 'l1', journalId: 'j1', asset: 'USDT', account: 'USER_AVAILABLE', delta: '-10' },
        { lineId: 'l2', journalId: 'j1', asset: 'USDT', account: 'USER_LOCKED', delta: '9' },
      ])
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('不平衡');
  });

  it('接受平衡分录', () => {
    const result = validateLedgerJournal(
      baseJournal([
        { lineId: 'l1', journalId: 'j1', asset: 'USDT', account: 'USER_AVAILABLE', delta: '-10' },
        { lineId: 'l2', journalId: 'j1', asset: 'USDT', account: 'USER_LOCKED', delta: '10' },
      ])
    );

    expect(result.valid).toBe(true);
  });
});
