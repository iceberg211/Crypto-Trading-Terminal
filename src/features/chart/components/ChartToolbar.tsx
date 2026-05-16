import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { intervalAtom } from '../atoms/klineAtom';
import { chartViewAtom } from '../atoms/chartViewAtom';
import type { KlineInterval } from '@/types/binance';

const intervals: { value: KlineInterval; label: string }[] = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' },
];

interface ChartToolbarProps {
  chartType: 'candles' | 'line';
  showVolume: boolean;
  showMA: boolean;
  showEMA: boolean;
  showBOLL: boolean;
  activeSubchartTypes: Array<'MACD' | 'RSI' | 'KDJ' | 'OBV' | 'WR'>;
  onChangeChartType: (type: 'candles' | 'line') => void;
  onToggleVolume: () => void;
  onToggleMA: () => void;
  onToggleEMA: () => void;
  onToggleBOLL: () => void;
  onSelectSubchart: (type: 'MACD' | 'RSI' | 'KDJ' | 'OBV' | 'WR' | null) => void;
  onResetScale: () => void;
  onGoToLatest: () => void;
}

export function ChartToolbar({
  chartType,
  showVolume,
  showMA,
  showEMA,
  showBOLL,
  activeSubchartTypes,
  onChangeChartType,
  onToggleVolume,
  onToggleMA,
  onToggleEMA,
  onToggleBOLL,
  onSelectSubchart,
  onResetScale,
  onGoToLatest,
}: ChartToolbarProps) {
  const [currentInterval, setCurrentInterval] = useAtom(intervalAtom);
  const [chartView, setChartView] = useAtom(chartViewAtom);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const isTradingView = chartView === 'tradingview';

  const btnBase =
    'h-7 px-2 text-xxs font-medium rounded-sm transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35';
  const menuItemBase =
    'w-full h-8 px-3 text-xs text-left flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35';

  const activeSettingsCount =
    (showVolume ? 1 : 0) +
    (showMA ? 1 : 0) +
    (showEMA ? 1 : 0) +
    (showBOLL ? 1 : 0) +
    activeSubchartTypes.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (viewMenuRef.current && !viewMenuRef.current.contains(target)) {
        setViewMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setViewMenuOpen(false);
        setSettingsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-thin pr-1">
          <div className="flex items-center gap-0.5 min-w-max">
            {intervals.map((interval) => (
              <button
                key={interval.value}
                onClick={() => setCurrentInterval(interval.value)}
                className={`
                  ${btnBase} shrink-0
                  ${currentInterval === interval.value
                    ? 'text-text-primary bg-bg-soft'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-soft/60'
                  }
                `}
              >
                {interval.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block h-4 w-px bg-line-dark shrink-0" />

        <div ref={viewMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setViewMenuOpen((prev) => !prev);
              setSettingsMenuOpen(false);
            }}
            className={`
              ${btnBase} flex items-center gap-1.5
              ${viewMenuOpen || chartView === 'basic'
                ? 'text-text-primary bg-bg-soft'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-soft/60'
              }
            `}
          >
            <span>{isTradingView ? 'TradingView' : '基础图表'}</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className={`transition-transform ${viewMenuOpen ? 'rotate-180' : ''}`}
            >
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {viewMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-bg-card border border-line-dark rounded-panel shadow-xl z-tooltip overflow-hidden">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setChartView('basic');
                    setViewMenuOpen(false);
                  }}
                  className={`${menuItemBase} ${!isTradingView
                      ? 'bg-up/20 text-up'
                      : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                    }`}
                >
                  <span>基础图表</span>
                  {!isTradingView && <span className="text-[10px]">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartView('tradingview');
                    setViewMenuOpen(false);
                  }}
                  className={`${menuItemBase} ${isTradingView
                      ? 'bg-up/20 text-up'
                      : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                    }`}
                >
                  <span>TradingView</span>
                  {isTradingView && <span className="text-[10px]">✓</span>}
                </button>
              </div>
            </div>
          )}
        </div>

        {!isTradingView && (
          <div ref={settingsMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setSettingsMenuOpen((prev) => !prev);
                setViewMenuOpen(false);
              }}
              className={`
                ${btnBase} flex items-center gap-1.5
                ${settingsMenuOpen || activeSettingsCount > 0
                  ? 'text-text-primary bg-bg-soft'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-soft/60'
                }
              `}
            >
              <span>{chartType === 'candles' ? '蜡烛' : '折线'}</span>
              {activeSettingsCount > 0 && (
                <span className="px-1 py-0.5 rounded bg-bg-soft text-[10px] leading-none">{activeSettingsCount}</span>
              )}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className={`transition-transform ${settingsMenuOpen ? 'rotate-180' : ''}`}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {settingsMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-bg-card border border-line-dark rounded-panel shadow-xl z-tooltip overflow-hidden">
                <div className="px-3 h-7 flex items-center text-[10px] text-text-tertiary border-b border-line-dark bg-bg-panel/70">
                  图表类型
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => onChangeChartType('candles')}
                    className={`${menuItemBase} ${chartType === 'candles'
                        ? 'bg-up/20 text-up'
                        : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                      }`}
                  >
                    <span>蜡烛</span>
                    {chartType === 'candles' && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeChartType('line')}
                    className={`${menuItemBase} ${chartType === 'line'
                        ? 'bg-up/20 text-up'
                        : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                      }`}
                  >
                    <span>折线</span>
                    {chartType === 'line' && <span className="text-[10px]">✓</span>}
                  </button>
                </div>

                <div className="h-px bg-line-dark" />
                <div className="px-3 h-7 flex items-center text-[10px] text-text-tertiary border-b border-line-dark bg-bg-panel/70">
                  主图叠加
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={onToggleVolume}
                    className={`${menuItemBase} ${showVolume
                        ? 'bg-up/20 text-up'
                        : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                      }`}
                  >
                    <span>成交量</span>
                    {showVolume && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleMA}
                    className={`${menuItemBase} ${showMA
                        ? 'bg-up/20 text-up'
                        : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                      }`}
                  >
                    <span>均线</span>
                    {showMA && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleEMA}
                    className={`${menuItemBase} ${showEMA
                        ? 'bg-up/20 text-up'
                        : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                      }`}
                  >
                    <span>EMA</span>
                    {showEMA && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleBOLL}
                    className={`${menuItemBase} ${showBOLL
                        ? 'bg-up/20 text-up'
                        : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                      }`}
                  >
                    <span>布林</span>
                    {showBOLL && <span className="text-[10px]">✓</span>}
                  </button>
                </div>

                <div className="h-px bg-line-dark" />
                <div className="px-3 h-7 flex items-center text-[10px] text-text-tertiary border-b border-line-dark bg-bg-panel/70">
                  副图指标
                </div>
                <div className="py-1">
                  {(['MACD', 'RSI', 'KDJ', 'OBV', 'WR'] as const).map((type) => {
                    const isActive = activeSubchartTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onSelectSubchart(type)}
                        className={`${menuItemBase} ${isActive
                            ? 'bg-up/20 text-up'
                            : 'text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary'
                          }`}
                      >
                        <span>{type}</span>
                        {isActive && <span className="text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isTradingView && (
        <div className="shrink-0 flex items-center gap-0.5">
          <button
            onClick={onResetScale}
            className={`${btnBase} text-text-secondary hover:text-text-primary hover:bg-bg-soft/60`}
          >
            重置
          </button>
          <button
            onClick={onGoToLatest}
            className={`${btnBase} text-text-secondary hover:text-text-primary hover:bg-bg-soft/60`}
          >
            最新
          </button>
        </div>
      )}
    </div>
  );
}
