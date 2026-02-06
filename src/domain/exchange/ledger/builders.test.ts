import { describe, expect, it } from 'vitest';
import {
  buildFeeJournal,
  buildLockJournal,
  buildTradeSettleJournal,
  buildUnlockJournal,
} from '@/domain/exchange/ledger/builders';
import { validateLedgerJournal } from '@/domain/exchange/ledger/validation';

const base = {
  flowId: 'f_1',
  orderId: 1001,
  symbol: 'BTCUSDT',
  side: 'BUY' as const,
};

describe('ledger builders', () => {
  it('LOCK/UNLOCK 分录可通过平衡校验', () => {
    const lock = buildLockJournal(base, { asset: 'USDT', amount: '100.00' });
    const unlock = buildUnlockJournal(base, { asset: 'USDT', amount: '20.00' });

    expect(validateLedgerJournal(lock).valid).toBe(true);
    expect(validateLedgerJournal(unlock).valid).toBe(true);
  });

  it('TRADE_SETTLE 分录可通过平衡校验', () => {
    const settle = buildTradeSettleJournal(base, {
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      baseAmount: '0.01000000',
      quoteAmount: '800.00000000',
      tradeId: 1,
    });

    expect(validateLedgerJournal(settle).valid).toBe(true);
    expect(settle.lines.length).toBeGreaterThanOrEqual(4);
  });

  it('手续费为 0 时不生成 FEE 分录', () => {
    const fee = buildFeeJournal(base, {
      commissionAsset: 'USDT',
      commission: '0',
      tradeId: 2,
    });

    expect(fee).toBeNull();
  });
});
