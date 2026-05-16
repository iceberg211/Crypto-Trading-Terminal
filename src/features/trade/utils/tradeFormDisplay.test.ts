import { describe, expect, it } from 'vitest';
import { getTradeFormDisplay } from './tradeFormDisplay';

describe('tradeFormDisplay', () => {
  it('买入时使用报价资产余额和动态交易对文案', () => {
    expect(getTradeFormDisplay({
      side: 'buy',
      submitting: false,
      baseAsset: 'SOL',
      quoteAsset: 'USDT',
      balances: {
        SOL: '50',
        USDT: '1234.5678',
      },
      pricePrecision: 2,
      quantityPrecision: 2,
    })).toMatchObject({
      availableBalance: '1234.57',
      balanceUnit: 'USDT',
      amountUnit: 'SOL',
      quoteUnit: 'USDT',
      submitLabel: '买入 SOL',
      symbolLabel: 'SOL/USDT',
    });
  });

  it('卖出时使用基础资产余额和动态交易对文案', () => {
    expect(getTradeFormDisplay({
      side: 'sell',
      submitting: false,
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      balances: {
        ETH: '1.234567',
        BTC: '0.5',
      },
      pricePrecision: 6,
      quantityPrecision: 4,
    })).toMatchObject({
      availableBalance: '1.2346',
      balanceUnit: 'ETH',
      amountUnit: 'ETH',
      quoteUnit: 'BTC',
      submitLabel: '卖出 ETH',
      symbolLabel: 'ETH/BTC',
    });
  });

  it('提交中时覆盖按钮文案', () => {
    expect(getTradeFormDisplay({
      side: 'buy',
      submitting: true,
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      balances: {},
      pricePrecision: 2,
      quantityPrecision: 6,
    }).submitLabel).toBe('处理中...');
  });
});
