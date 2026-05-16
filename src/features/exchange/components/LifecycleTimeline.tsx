import { memo } from 'react';
import dayjs from 'dayjs';
import type { LifecycleEvent } from '@/domain/exchange';

const stageLabel: Record<LifecycleEvent['stage'], string> = {
  ORDER_SUBMIT_REQUESTED: '提交请求',
  ORDER_VALIDATED: '订单校验通过',
  FUNDS_LOCKED: '资金冻结',
  ORDER_ACCEPTED: '订单已受理',
  ORDER_REJECTED: '订单拒绝',
  ORDER_TRIGGERED: '止损触发',
  ORDER_PARTIALLY_FILLED: '部分成交',
  ORDER_FILLED: '完全成交',
  ORDER_CANCELED: '订单取消',
  FUNDS_UNLOCKED: '资金解冻',
  TRADE_SETTLED: '成交清算',
  LEDGER_POSTED: '账务入账',
};

export const LifecycleTimeline = memo(function LifecycleTimeline({ events }: { events: LifecycleEvent[] }) {
  if (events.length === 0) {
    return <div className="p-4 text-xs text-text-tertiary">暂无生命周期记录</div>;
  }

  return (
    <div className="h-full overflow-auto px-3 py-2">
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.eventId} className="rounded border border-line-dark bg-bg-soft/50 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-primary">{stageLabel[event.stage]}</span>
              <span className="font-mono text-[10px] text-text-tertiary">
                {dayjs(event.timestamp).format('MM-DD HH:mm:ss')}
              </span>
            </div>
            {event.payload && Object.keys(event.payload).length > 0 ? (
              <pre className="mt-1 overflow-auto rounded bg-bg-panel p-2 text-[10px] text-text-secondary">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
});
