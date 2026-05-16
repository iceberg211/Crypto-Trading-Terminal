import { describe, expect, it } from 'vitest';
import type { Candle } from '@/types/binance';
import {
  KlineMemoryCache,
  mergeKlineBatch,
  trimKlines,
} from './klineData';

function candle(time: number, close = String(time)): Candle {
  return {
    time,
    open: close,
    high: close,
    low: close,
    close,
    volume: '1',
  };
}

describe('klineData', () => {
  it('合并 K 线时按 time 去重、排序，并让新数据覆盖旧数据', () => {
    const result = mergeKlineBatch(
      [candle(3, 'old'), candle(1)],
      [candle(2), candle(3, 'new')]
    );

    expect(result.addedCount).toBe(1);
    expect(result.candles.map((item) => item.time)).toEqual([1, 2, 3]);
    expect(result.candles[2].close).toBe('new');
  });

  it('裁剪时保留最新的 K 线窗口', () => {
    const result = trimKlines([candle(3), candle(1), candle(2), candle(4)], 2);

    expect(result.map((item) => item.time)).toEqual([3, 4]);
  });

  it('缓存命中时返回副本，避免调用方改写内部缓存', () => {
    const cache = new KlineMemoryCache({ ttlMs: 1000, maxCandles: 10 });
    cache.set('BTCUSDT', '15m', [candle(1)], 1000);

    const first = cache.getFresh('BTCUSDT', '15m', 1200);
    first?.push(candle(2));

    const second = cache.getFresh('BTCUSDT', '15m', 1200);
    expect(second?.map((item) => item.time)).toEqual([1]);
  });

  it('缓存过期后不再命中', () => {
    const cache = new KlineMemoryCache({ ttlMs: 1000, maxCandles: 10 });
    cache.set('BTCUSDT', '15m', [candle(1)], 1000);

    expect(cache.getFresh('BTCUSDT', '15m', 2501)).toBeNull();
  });
});
