import { afterEach, describe, expect, it } from 'vitest';
import { feeEngine } from '@/domain/fee';
import { DEFAULT_FEE_CONFIG } from '@/domain/fee/types';
import { calculateFillFee } from './feePolicy';

describe('feePolicy', () => {
  afterEach(() => {
    feeEngine.updateConfig(DEFAULT_FEE_CONFIG);
  });

  it('使用统一 feeEngine 计算 maker 手续费', () => {
    feeEngine.updateConfig({
      makerRate: '0.0005',
      takerRate: '0.0015',
      bnbDiscount: true,
      discountRate: 0.25,
    });

    const result = calculateFillFee({
      quoteQty: '1000',
      baseQty: '0.5',
      isMaker: true,
      side: 'SELL',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
    });

    expect(result).toMatchObject({
      commission: '0.37500000',
      commissionAsset: 'USDT',
      finalRate: '0.000375',
      isMaker: true,
    });
  });

  it('买入成交用基础资产作为手续费资产', () => {
    const result = calculateFillFee({
      quoteQty: '2000',
      baseQty: '1',
      isMaker: false,
      side: 'BUY',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
    });

    expect(result.commission).toBe('0.00100000');
    expect(result.commissionAsset).toBe('ETH');
  });
});
