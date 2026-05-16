import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { symbolConfigAtom } from '@/domain/symbol';
import { tickerAtom } from '@/features/ticker/atoms/tickerAtom';
import { useTicker } from '@/features/ticker/hooks/useTicker';
import { SymbolSelector } from '@/features/symbol/components/SymbolSelector';
import { PriceFlash } from '@/components/ui/PriceFlash';

// 格式化大数字
const formatLargeNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toFixed(2);
};

// 格式化价格（使用动态精度）
const formatPrice = (value: string, decimals = 2): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return '--';
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export function TickerBar() {
  // 使用 symbolConfigAtom 获取完整配置
  const symbolConfig = useAtomValue(symbolConfigAtom);
  const ticker = useAtomValue(tickerAtom);
  const prevPriceRef = useRef<string>('');

  // 初始化 Ticker 数据加载
  useTicker();

  const lastPrice = ticker?.lastPrice || '';
  const priceChangePercent = ticker?.priceChangePercent
    ? parseFloat(ticker.priceChangePercent)
    : 0;
  const isPositive = priceChangePercent >= 0;

  // 从 symbolConfigAtom 获取动态配置
  const { baseAsset, quoteAsset, pricePrecision } = symbolConfig;

  // 更新前一价格引用
  if (lastPrice && lastPrice !== prevPriceRef.current) {
    prevPriceRef.current = lastPrice;
  }

  return (
    <div className="relative z-40 flex items-center bg-bg-card border-b border-line-dark">

      {/* Symbol Selector - 独立容器，不受 overflow 影响 */}
      <div className="flex items-center gap-2 shrink-0 px-2 sm:px-3 h-12">

        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
          {baseAsset.charAt(0)}
        </div>
        <SymbolSelector />
      </div>

      {/* Divider */}
      <div className="w-px h-7 bg-line-dark shrink-0" />


      {/* 可滚动区域：价格和统计数据 */}
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
        <div className="flex items-center min-w-max gap-3 sm:gap-4 lg:gap-6 px-2 sm:px-3 h-12">

        {/* Last Price with Flash Animation */}
          <div className="shrink-0 min-w-[128px] sm:min-w-[160px]">
            <div className="font-heading text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight tabular-nums whitespace-nowrap">
              <PriceFlash
                price={lastPrice}
                precision={pricePrecision}
                className={isPositive ? 'text-up' : 'text-down'}
              />
            </div>
            <div className="text-xxs text-text-tertiary whitespace-nowrap">
              ≈ ${lastPrice ? formatPrice(lastPrice, pricePrecision) : '--'}
            </div>
          </div>

        {/* 24h Stats */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 text-xxs shrink-0">

            <div className="min-w-[72px] sm:min-w-[84px]">
              <span className="text-text-tertiary block text-xxs whitespace-nowrap">
                <span className="sm:hidden">涨跌</span>
                <span className="hidden sm:inline">24h 涨跌</span>
              </span>
              <span className={`font-mono font-medium tabular-nums whitespace-nowrap ${isPositive ? 'text-up' : 'text-down'}`}>
                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
            <div className="hidden sm:block min-w-[96px]">
              <span className="text-text-tertiary block text-xxs whitespace-nowrap">24h 最高</span>
              <span className="text-text-primary font-mono tabular-nums whitespace-nowrap">
                {ticker?.highPrice ? formatPrice(ticker.highPrice, pricePrecision) : '--'}
              </span>
            </div>
            <div className="hidden sm:block min-w-[96px]">
              <span className="text-text-tertiary block text-xxs whitespace-nowrap">24h 最低</span>
              <span className="text-text-primary font-mono tabular-nums whitespace-nowrap">
                {ticker?.lowPrice ? formatPrice(ticker.lowPrice, pricePrecision) : '--'}
              </span>
            </div>
            <div className="hidden md:block min-w-[120px]">
              <span className="text-text-tertiary block text-xxs whitespace-nowrap">24h 成交量({baseAsset})</span>
              <span className="text-text-primary font-mono tabular-nums whitespace-nowrap">
                {ticker?.volume ? formatLargeNumber(ticker.volume) : '--'}
              </span>
            </div>
            <div className="hidden lg:block min-w-[132px]">
              <span className="text-text-tertiary block text-xxs whitespace-nowrap">24h 成交额({quoteAsset})</span>
              <span className="text-text-primary font-mono tabular-nums whitespace-nowrap">
                {ticker?.quoteVolume ? formatLargeNumber(ticker.quoteVolume) : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
