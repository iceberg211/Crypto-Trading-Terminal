import { useState, memo } from 'react';
import { useSetAtom } from 'jotai';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { OpenOrders } from '@/features/orders/components/OpenOrders';
import { OrderHistory } from '@/features/orders/components/OrderHistory';
import { TradeHistory } from '@/features/orders/components/TradeHistory';
import { PanelTabs, PanelTab } from '@/components/ui';
import { ExchangeAuditDrawer, auditDrawerOpenAtom } from '@/features/exchange';

type TabType = 'open' | 'history' | 'trades';

/**
 * 订单管理面板
 * 包含当前委托、历史订单、成交记录三个 Tab
 */
export const OrderPanel = memo(function OrderPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const setAuditOpen = useSetAtom(auditDrawerOpenAtom);
  // 使用 useOrders 获取真实订单数据
  const { openOrders } = useOrders();
  const openOrdersCount = openOrders.length;

  const tabs: PanelTab[] = [
    { key: 'open', label: '当前委托', badge: openOrdersCount > 0 ? openOrdersCount : undefined },
    { key: 'history', label: '历史订单' },
    { key: 'trades', label: '成交记录' },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-card">
      <div className="flex items-center justify-between border-b border-line-dark bg-bg-panel px-2">
        <PanelTabs tabs={tabs} activeKey={activeTab} onChange={(k) => setActiveTab(k as TabType)} aria-label="订单面板" className="flex-1 border-b-0 bg-transparent px-0" />
        <button
          type="button"
          className="ml-2 h-7 rounded-sm border border-line-dark px-2 text-xxs text-text-secondary hover:bg-bg-soft/60 hover:text-text-primary"
          onClick={() => setAuditOpen(true)}
        >
          审计
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'open' && <OpenOrders />}
        {activeTab === 'history' && <OrderHistory />}
        {activeTab === 'trades' && <TradeHistory />}
      </div>
      <ExchangeAuditDrawer />
    </div>
  );
});
