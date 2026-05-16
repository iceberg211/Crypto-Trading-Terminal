import { describe, expect, it } from 'vitest';
import { createFallbackSymbolConfig, resolveSymbolAssets } from './symbolConfig';

describe('symbolConfig', () => {
  it('按最长报价资产后缀解析交易对资产', () => {
    expect(resolveSymbolAssets('SOLUSDC')).toEqual({
      baseAsset: 'SOL',
      quoteAsset: 'USDC',
    });

    expect(resolveSymbolAssets('ETHBTC')).toEqual({
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
    });
  });

  it('无法识别报价资产时保留完整 symbol 并回退到 USDT', () => {
    expect(resolveSymbolAssets('FOOXYZ')).toEqual({
      baseAsset: 'FOOXYZ',
      quoteAsset: 'USDT',
    });
  });

  it('创建 fallback 配置时复用解析出的基础资产和报价资产', () => {
    const config = createFallbackSymbolConfig('SOLUSDC');

    expect(config).toMatchObject({
      symbol: 'SOLUSDC',
      baseAsset: 'SOL',
      quoteAsset: 'USDC',
      status: 'TRADING',
    });
  });
});
