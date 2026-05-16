import type { Candle, KlineInterval } from '@/types/binance';

export const KLINE_LIMITS = {
  maxCandles: 3000,
  initialCandles: 200,
  loadMoreCandles: 200,
  reconnectCandles: 50,
  cacheTtlMs: 60_000,
} as const;

interface MergeKlineBatchOptions {
  maxCandles?: number;
}

export interface MergeKlineBatchResult {
  candles: Candle[];
  addedCount: number;
}

interface KlineCacheEntry {
  candles: Candle[];
  updatedAt: number;
}

interface KlineMemoryCacheOptions {
  ttlMs?: number;
  maxCandles?: number;
}

function cloneCandles(candles: Candle[]): Candle[] {
  return candles.map((candle) => ({ ...candle }));
}

function getCacheKey(symbol: string, interval: KlineInterval): string {
  return `${symbol.toUpperCase()}::${interval}`;
}

export function trimKlines(
  candles: Candle[],
  maxCandles: number = KLINE_LIMITS.maxCandles
): Candle[] {
  const sorted = [...candles].sort((a, b) => a.time - b.time);

  if (sorted.length <= maxCandles) {
    return sorted;
  }

  return sorted.slice(-maxCandles);
}

export function mergeKlineBatch(
  existing: Candle[],
  incoming: Candle[],
  options: MergeKlineBatchOptions = {}
): MergeKlineBatchResult {
  const existingTimes = new Set(existing.map((candle) => candle.time));
  const byTime = new Map<number, Candle>();

  for (const candle of existing) {
    byTime.set(candle.time, candle);
  }

  for (const candle of incoming) {
    byTime.set(candle.time, candle);
  }

  return {
    candles: trimKlines(Array.from(byTime.values()), options.maxCandles),
    addedCount: incoming.filter((candle) => !existingTimes.has(candle.time)).length,
  };
}

export class KlineMemoryCache {
  private readonly ttlMs: number;
  private readonly maxCandles: number;
  private readonly store = new Map<string, KlineCacheEntry>();

  constructor(options: KlineMemoryCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? KLINE_LIMITS.cacheTtlMs;
    this.maxCandles = options.maxCandles ?? KLINE_LIMITS.maxCandles;
  }

  getFresh(symbol: string, interval: KlineInterval, now = Date.now()): Candle[] | null {
    const entry = this.store.get(getCacheKey(symbol, interval));
    if (!entry) return null;

    if (now - entry.updatedAt > this.ttlMs) {
      this.store.delete(getCacheKey(symbol, interval));
      return null;
    }

    return cloneCandles(entry.candles);
  }

  set(symbol: string, interval: KlineInterval, candles: Candle[], now = Date.now()): void {
    this.store.set(getCacheKey(symbol, interval), {
      candles: cloneCandles(trimKlines(candles, this.maxCandles)),
      updatedAt: now,
    });
  }

  merge(symbol: string, interval: KlineInterval, incoming: Candle[], now = Date.now()): MergeKlineBatchResult {
    const existing = this.store.get(getCacheKey(symbol, interval))?.candles ?? [];
    const result = mergeKlineBatch(existing, incoming, { maxCandles: this.maxCandles });

    this.set(symbol, interval, result.candles, now);
    return {
      candles: cloneCandles(result.candles),
      addedCount: result.addedCount,
    };
  }

  clear(): void {
    this.store.clear();
  }
}

export const klineMemoryCache = new KlineMemoryCache();
