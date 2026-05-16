import { useEffect, useRef, useCallback, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  symbolAtom,
  intervalAtom,
  klineDataAtom,
  klineLoadingAtom,
  klineErrorAtom,
  wsStatusAtom,
} from '../atoms/klineAtom';
import { binanceApi } from '@/core/api/binance';
import { marketDataHub } from '@/core/gateway';
import {
  KLINE_LIMITS,
  klineMemoryCache,
  mergeKlineBatch,
  trimKlines,
} from '@/domain/market';
import { logger } from '@/utils/logger';
import type { BinanceKlineWsMessage, Candle } from '@/types/binance';

function formatKlineError(err: unknown): string {
  const anyErr = err as any;
  const status = anyErr?.response?.status as number | undefined;
  const serverMsg = anyErr?.response?.data?.msg as string | undefined;
  const networkMsg = anyErr?.message as string | undefined;

  if (status) {
    if (status === 429) return '请求过于频繁，请稍后再试';
    if (status === 404) return '交易对或数据源不存在';
    if (status >= 500) return `数据源异常（HTTP ${status}），请稍后再试`;
    if (status >= 400) return `请求参数异常（HTTP ${status}）`;
    return `请求失败（HTTP ${status}）`;
  }

  if (serverMsg) {
    return `数据源返回错误：${serverMsg}`;
  }

  if (networkMsg?.toLowerCase().includes('network')) {
    return '网络异常，请检查连接或稍后再试';
  }

  return 'K 线数据加载失败，请稍后再试';
}

/**
 * K 线数据管理 Hook
 * 使用 MarketDataHub 统一订阅层
 */
export function useKlineData() {
  const symbol = useAtomValue(symbolAtom);
  const interval = useAtomValue(intervalAtom);
  const [klineData, setKlineData] = useAtom(klineDataAtom);
  const [loading, setLoading] = useAtom(klineLoadingAtom);
  const [error, setError] = useAtom(klineErrorAtom);
  const [wsStatus, setWsStatus] = useAtom(wsStatusAtom);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const updateBufferRef = useRef<Candle | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const latestSymbolRef = useRef(symbol);
  const latestIntervalRef = useRef(interval);
  const loadRequestIdRef = useRef(0);
  const loadMoreRequestIdRef = useRef(0);
  const prevWsStatusRef = useRef(wsStatus);
  const reconnectFillRequestIdRef = useRef(0);
  
  useEffect(() => {
    latestSymbolRef.current = symbol;
    latestIntervalRef.current = interval;
    // 标记旧请求失效，避免切换交易对后覆盖新数据
    loadRequestIdRef.current += 1;
    loadMoreRequestIdRef.current += 1;
    setHasMore(true);
  }, [symbol, interval]);

  /**
   * 加载历史 K 线数据
   */
  const loadHistoricalData = useCallback(async (options?: { force?: boolean }) => {
    const requestId = ++loadRequestIdRef.current;
    setError(null);

    if (!options?.force) {
      const cached = klineMemoryCache.getFresh(symbol, interval);
      if (cached) {
        setKlineData(cached);
        setHasMore(cached.length >= KLINE_LIMITS.initialCandles);
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    try {
      const candles = await binanceApi.getKlines(symbol, interval, KLINE_LIMITS.initialCandles);
      
      // 忽略过期响应
      if (requestId !== loadRequestIdRef.current) return;
      if (latestSymbolRef.current !== symbol || latestIntervalRef.current !== interval) return;
      
      const nextCandles = trimKlines(candles);
      klineMemoryCache.set(symbol, interval, nextCandles);
      setKlineData(nextCandles);
      setHasMore(candles.length >= KLINE_LIMITS.initialCandles);
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return;
      setError(formatKlineError(err));
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [symbol, interval, setKlineData, setLoading, setError]);

  /**
   * 加载更早的历史数据（左侧翻页）
   * @returns 加载的数据条数
   */
  const loadMore = useCallback(async (): Promise<number> => {
    // 防止无效请求
    if (klineData.length === 0 || loading || loadingMore || !hasMore) return 0;

    const firstCandle = klineData[0];
    const endTime = firstCandle.time * 1000 - 1; // 毫秒，减1避免重复
    const requestId = ++loadMoreRequestIdRef.current;

    try {
      setLoadingMore(true);
      const olderCandles = await binanceApi.getKlines(symbol, interval, KLINE_LIMITS.loadMoreCandles, endTime);
      
      // 忽略过期响应
      if (requestId !== loadMoreRequestIdRef.current) return 0;
      if (latestSymbolRef.current !== symbol || latestIntervalRef.current !== interval) return 0;
      
      if (olderCandles.length === 0) {
        logger.debug('[useKlineData] No more historical data available');
        setHasMore(false);
        return 0;
      }

      const preview = mergeKlineBatch(klineData, olderCandles);

      setKlineData((prev) => {
        const result = mergeKlineBatch(prev, olderCandles);
        if (result.addedCount === 0) return prev;

        klineMemoryCache.set(symbol, interval, result.candles);
        logger.debug(`[useKlineData] Loaded ${result.addedCount} more candles`);
        return result.candles;
      });
      
      if (olderCandles.length < KLINE_LIMITS.loadMoreCandles) {
        setHasMore(false);
      }

      return preview.addedCount;
    } catch (err) {
      if (requestId === loadMoreRequestIdRef.current) {
        setError(`加载更多失败：${formatKlineError(err)}`);
      }
      logger.warn('[useKlineData] Failed to load more data:', err);
      return 0;
    } finally {
      if (requestId === loadMoreRequestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [hasMore, interval, klineData, loading, loadingMore, setError, setKlineData, symbol]);

  /**
   * 合并实时 K 线更新
   */
  const mergeKlineUpdate = useCallback((newCandle: Candle) => {
    setKlineData((prev) => {
      const result = mergeKlineBatch(prev, [newCandle]);
      klineMemoryCache.set(symbol, interval, result.candles);
      return result.candles;
    });
  }, [interval, setKlineData, symbol]);

  /**
   * 使用 requestAnimationFrame 批量更新
   */
  const scheduleUpdate = useCallback((candle: Candle) => {
    updateBufferRef.current = candle;

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        if (updateBufferRef.current) {
          mergeKlineUpdate(updateBufferRef.current);
          updateBufferRef.current = null;
        }
        rafIdRef.current = null;
      });
    }
  }, [mergeKlineUpdate]);

  /**
   * 处理 WebSocket 消息
   */
  const handleWsMessage = useCallback((data: any) => {
    // MarketDataHub 已经解包了 Combined Stream
    const klineMsg = data as BinanceKlineWsMessage;

    if (klineMsg.e !== 'kline') return;
    
    const k = klineMsg.k;
    const msgSymbol = klineMsg.s || k.s;
    const msgInterval = k.i;
    
    // 过滤非当前交易对/周期的数据
    if (msgSymbol && msgSymbol !== symbol) return;
    if (msgInterval && msgInterval !== interval) return;

    const candle: Candle = {
      time: Math.floor(k.t / 1000),
      open: k.o,
      high: k.h,
      low: k.l,
      close: k.c,
      volume: k.v,
    };

    scheduleUpdate(candle);
  }, [scheduleUpdate, symbol, interval]);

  /**
   * 初始化 WebSocket 订阅
   */
  useEffect(() => {
    // 通过 MarketDataHub 订阅
    const unsubscribe = marketDataHub.subscribe('kline', symbol, interval);
    const unregister = marketDataHub.onMessage('kline', handleWsMessage);

    // 使用事件监听替代轮询
    const unregisterStatus = marketDataHub.onStatusChange(setWsStatus);

    // 清理
    return () => {
      unsubscribe();
      unregister();
      unregisterStatus();
      
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [symbol, interval, handleWsMessage, setWsStatus]);

  /**
   * 断线补齐：当 WS 从断线状态恢复时，拉取最近的K线数据填补空缺
   */
  useEffect(() => {
    const prevStatus = prevWsStatusRef.current;
    prevWsStatusRef.current = wsStatus;

    // 只有从非 connected 状态变为 connected 时才触发补齐
    const wasDisconnected = prevStatus === 'disconnected' || prevStatus === 'reconnecting';
    const isNowConnected = wsStatus === 'connected';

    if (wasDisconnected && isNowConnected && klineData.length > 0) {
      const requestId = ++reconnectFillRequestIdRef.current;
      
      // 拉取最近 50 根K线来补齐可能的断层
      binanceApi.getKlines(symbol, interval, KLINE_LIMITS.reconnectCandles)
        .then((recentCandles) => {
          // 忽略过期响应
          if (requestId !== reconnectFillRequestIdRef.current) return;
          if (latestSymbolRef.current !== symbol || latestIntervalRef.current !== interval) return;
          
          if (recentCandles.length === 0) return;
          
          setKlineData((prev) => {
            const result = mergeKlineBatch(prev, recentCandles);
            klineMemoryCache.set(symbol, interval, result.candles);

            logger.debug(`[useKlineData] 断线补齐: 原 ${prev.length} 根, 补齐后 ${result.candles.length} 根`);
            return result.candles;
          });
        })
        .catch((err) => {
          logger.warn('[useKlineData] 断线补齐失败:', err);
        });
    }
  }, [wsStatus, symbol, interval, klineData.length, setKlineData]);

  /**
   * 当 symbol 或 interval 变化时，立即清空旧数据并重新加载
   */
  useEffect(() => {
    const cached = klineMemoryCache.getFresh(symbol, interval);
    setKlineData(cached || []);
    
    loadHistoricalData();
  }, [interval, loadHistoricalData, setKlineData, symbol]);

  return {
    klineData,
    loading,
    error,
    wsStatus,
    reload: () => loadHistoricalData({ force: true }),
    loadMore,
    loadingMore,
    hasMore,
  };
}
