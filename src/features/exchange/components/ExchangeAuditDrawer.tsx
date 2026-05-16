import { useEffect, memo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  clearExchangeAuditAtom,
  exchangeAuditOrderIdsAtom,
  getEventsByOrderAtom,
  getJournalsByOrderAtom,
  exchangeAuditStatsAtom,
} from '@/domain/exchange';
import { PanelTabs } from '@/components/ui';
import {
  auditDrawerOpenAtom,
  auditDrawerTabAtom,
  auditSelectedOrderIdAtom,
  type AuditTab,
} from '../atoms/auditDrawerAtom';
import { LifecycleTimeline } from './LifecycleTimeline';
import { LedgerJournalList } from './LedgerJournalList';

export const ExchangeAuditDrawer = memo(function ExchangeAuditDrawer() {
  const [open, setOpen] = useAtom(auditDrawerOpenAtom);
  const [activeTab, setActiveTab] = useAtom(auditDrawerTabAtom);
  const [selectedOrderId, setSelectedOrderId] = useAtom(auditSelectedOrderIdAtom);

  const orderIds = useAtomValue(exchangeAuditOrderIdsAtom);
  const stats = useAtomValue(exchangeAuditStatsAtom);

  const getEventsByOrder = useAtomValue(getEventsByOrderAtom);
  const getJournalsByOrder = useAtomValue(getJournalsByOrderAtom);

  const clearAudit = useSetAtom(clearExchangeAuditAtom);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    if (orderIds.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !orderIds.includes(selectedOrderId)) {
      setSelectedOrderId(orderIds[0]);
    }
  }, [open, orderIds, selectedOrderId, setSelectedOrderId]);

  if (!open) return null;

  const events = selectedOrderId ? getEventsByOrder(selectedOrderId) : [];
  const journals = selectedOrderId ? getJournalsByOrder(selectedOrderId) : [];

  const tabs = [
    { key: 'lifecycle', label: '生命周期' },
    { key: 'ledger', label: '账务分录' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />

      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-[420px] border-l border-line-dark bg-bg-card shadow-2xl">
        <div className="flex h-10 items-center justify-between border-b border-line-dark px-3">
          <div>
            <h3 className="text-sm font-medium text-text-primary">交易审计</h3>
            <p className="text-[10px] text-text-tertiary">
              事件 {stats.events} / 分录 {stats.journals}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="text-xs text-text-tertiary hover:text-text-secondary"
              onClick={() => clearAudit()}
            >
              清空
            </button>
            <button className="text-xs text-text-tertiary hover:text-text-secondary" onClick={() => setOpen(false)}>
              关闭
            </button>
          </div>
        </div>

        <div className="border-b border-line-dark px-3 py-2">
          <label className="mb-1 block text-[10px] text-text-tertiary">订单</label>
          <select
            className="h-8 w-full rounded-sm border border-line-dark bg-bg-soft px-2 text-xs text-text-primary"
            value={selectedOrderId ?? ''}
            onChange={(e) => setSelectedOrderId(e.target.value ? Number(e.target.value) : null)}
          >
            {orderIds.length === 0 ? <option value="">暂无订单</option> : null}
            {orderIds.map((id) => (
              <option key={id} value={id}>
                订单 #{id}
              </option>
            ))}
          </select>
        </div>

        <PanelTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as AuditTab)}
          aria-label="审计标签"
          className="h-9"
        />

        <div className="h-[calc(100%-120px)] min-h-0">
          {activeTab === 'lifecycle' ? <LifecycleTimeline events={events} /> : null}
          {activeTab === 'ledger' ? <LedgerJournalList journals={journals} /> : null}
        </div>
      </aside>
    </>
  );
});
