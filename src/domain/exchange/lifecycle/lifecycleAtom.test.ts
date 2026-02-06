import { createStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendLifecycleEventAtom,
  getEventsByOrderAtom,
  lifecycleEventsAtom,
  pruneLifecycleEventsAtom,
} from '@/domain/exchange/lifecycle/lifecycleAtom';
import { EXCHANGE_AUDIT_KEYS } from '@/domain/exchange/storage';

describe('lifecycleAtom', () => {
  beforeEach(() => {
    localStorage.removeItem(EXCHANGE_AUDIT_KEYS.lifecycle);
  });

  it('支持按订单追加和查询事件', () => {
    const store = createStore();

    store.set(appendLifecycleEventAtom, {
      flowId: 'flow_1',
      orderId: 101,
      symbol: 'BTCUSDT',
      side: 'BUY',
      stage: 'ORDER_SUBMIT_REQUESTED',
    });

    store.set(appendLifecycleEventAtom, {
      flowId: 'flow_1',
      orderId: 101,
      symbol: 'BTCUSDT',
      side: 'BUY',
      stage: 'FUNDS_LOCKED',
    });

    const getter = store.get(getEventsByOrderAtom);
    const events = getter(101);

    expect(events).toHaveLength(2);
    expect(events[0].stage).toBe('ORDER_SUBMIT_REQUESTED');
    expect(events[1].stage).toBe('FUNDS_LOCKED');
  });

  it('prune 会清理超过 7 天的数据', () => {
    const store = createStore();
    const oldTs = Date.now() - 8 * 24 * 60 * 60 * 1000;

    store.set(appendLifecycleEventAtom, {
      flowId: 'flow_old',
      orderId: 102,
      symbol: 'BTCUSDT',
      side: 'SELL',
      stage: 'ORDER_SUBMIT_REQUESTED',
      timestamp: oldTs,
      eventId: 'old_event',
    });

    store.set(appendLifecycleEventAtom, {
      flowId: 'flow_new',
      orderId: 103,
      symbol: 'BTCUSDT',
      side: 'BUY',
      stage: 'ORDER_SUBMIT_REQUESTED',
      eventId: 'new_event',
    });

    store.set(pruneLifecycleEventsAtom);

    const events = store.get(lifecycleEventsAtom);
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('new_event');
  });
});
