import { Suspense, ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { ErrorBoundary } from '../ErrorBoundary';
import { TickerBar } from '@/features/ticker/components/TickerBar';
import { RecentTrades } from '@/features/trade/components/RecentTrades';
import { AssetPanel } from '@/features/account/components/AssetPanel';
import { OrderPanel } from '@/features/orders/components/OrderPanel';
import { NetworkStatusBar } from '../ui/NetworkStatusBar';
import { DevPanel } from '../ui/DevPanel';
import { ChartContainer } from '../../features/chart/components/ChartContainer';
import { OrderBook } from '../../features/orderbook/components/OrderBook';
import { TradeForm } from '../../features/trade/components/TradeForm';
import { TradingModeTabs } from '../../features/trade/components/TradingModeTabs';
import { tradingModeAtom } from '../../features/trade/atoms/tradingModeAtom';
import { MarginTradeForm } from '../../features/margin/components/MarginTradeForm';
import { BorrowPanel } from '../../features/margin/components/BorrowPanel';
import { MarginInfoPanel } from '../../features/margin/components/MarginInfoPanel';
import { FuturesTradeForm } from '../../features/futures/components/FuturesTradeForm';
import { FundingRateBar } from '../../features/futures/components/FundingRateBar';
import { PositionPanel } from '../../features/futures/components/PositionPanel';

/**
 * 安全组件包裹器：包含错误边界和加载状态
 */
const SafeSection = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ErrorBoundary fallback={fallback}>
    <Suspense fallback={<div className="flex items-center justify-center h-full text-text-tertiary">加载中…</div>}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

/**
 * 右栏交易表单区域
 * 根据交易模式（现货/杠杆/合约）切换不同的表单和附属面板
 */
function TradeFormSection() {
  const mode = useAtomValue(tradingModeAtom);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 交易模式 Tab */}
      <TradingModeTabs />

      {/* 合约模式：资金费率条 */}
      {mode === 'futures' && <FundingRateBar />}

      {/* 交易表单 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {mode === 'spot' && <TradeForm />}
        {mode === 'margin' && (
          <>
            <MarginTradeForm />
            <BorrowPanel />
            <MarginInfoPanel />
          </>
        )}
        {mode === 'futures' && (
          <>
            <FuturesTradeForm />
            <PositionPanel />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 交易页面主布局
 * 类似币安的专业交易布局，支持现货/杠杆/合约 Tab 切换
 */
export function TradingLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      {/* Network Status Banner */}
      <NetworkStatusBar />
      <DevPanel />

      {/* Top: Ticker Bar (Fixed) */}
      <div className="shrink-0 border-b border-line-dark relative z-50 overflow-visible">
        <SafeSection fallback={<div className="h-14 bg-bg-card animate-pulse" />}>
          <TickerBar />
        </SafeSection>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px_320px] lg:divide-x lg:divide-line-dark">
        {/* Left Section: Chart + Order Panel */}
        <div className="min-h-0 flex flex-col border-b border-line-dark lg:border-b-0 lg:grid lg:grid-rows-[minmax(0,1fr)_minmax(180px,32%)]">
          {/* Chart */}
          <div className="min-h-0 border-b border-line-dark">
            <SafeSection>
              <ChartContainer />
            </SafeSection>
          </div>
          {/* Order Panel */}
          <div className="min-h-[160px] md:min-h-[200px] lg:min-h-0">
            <SafeSection>
              <OrderPanel />
            </SafeSection>
          </div>
        </div>

        {/* Middle Column: OrderBook & Trades (Fixed width) */}
        <div className="shrink-0 flex flex-col min-h-[420px] lg:min-h-0 border-b border-line-dark lg:border-b-0">
          {/* OrderBook */}
          <div className="flex-[3] min-h-0 border-b border-line-dark">
            <SafeSection>
              <OrderBook />
            </SafeSection>
          </div>
          {/* Recent Trades */}
          <div className="flex-[2] min-h-0">
            <SafeSection>
              <RecentTrades />
            </SafeSection>
          </div>
        </div>

        {/* Right Column: Trading Mode Tabs + Trade Form + Assets (Fixed width) */}
        <div className="shrink-0 flex flex-col min-h-[420px] lg:min-h-0">
          {/* Trade Form Section with Mode Tabs */}
          <div className="flex-1 min-h-0">
            <SafeSection>
              <TradeFormSection />
            </SafeSection>
          </div>
          {/* Asset Panel */}
          <SafeSection>
            <AssetPanel />
          </SafeSection>
        </div>

      </div>
    </div>
  );
}
