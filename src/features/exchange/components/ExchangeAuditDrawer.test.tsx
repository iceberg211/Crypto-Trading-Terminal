import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendLifecycleEventAtom,
  appendLedgerJournalAtom,
  buildLockJournal,
} from '@/domain/exchange';
import { auditDrawerOpenAtom, auditSelectedOrderIdAtom } from '@/features/exchange/atoms/auditDrawerAtom';
import { ExchangeAuditDrawer } from '@/features/exchange/components/ExchangeAuditDrawer';
import { EXCHANGE_AUDIT_KEYS } from '@/domain/exchange/storage';

describe('ExchangeAuditDrawer', () => {
  beforeEach(() => {
    localStorage.removeItem(EXCHANGE_AUDIT_KEYS.lifecycle);
    localStorage.removeItem(EXCHANGE_AUDIT_KEYS.ledger);
  });

  it('打开后能显示生命周期和分录数据', () => {
    const store = createStore();

    store.set(appendLifecycleEventAtom, {
      flowId: 'flow_1',
      orderId: 1,
      symbol: 'BTCUSDT',
      side: 'BUY',
      stage: 'ORDER_SUBMIT_REQUESTED',
    });

    const journal = buildLockJournal(
      {
        flowId: 'flow_1',
        orderId: 1,
        symbol: 'BTCUSDT',
        side: 'BUY',
      },
      {
        asset: 'USDT',
        amount: '100.00000000',
      }
    );

    store.set(appendLedgerJournalAtom, journal);
    store.set(auditSelectedOrderIdAtom, 1);
    store.set(auditDrawerOpenAtom, true);

    render(
      <Provider store={store}>
        <ExchangeAuditDrawer />
      </Provider>
    );

    expect(screen.getByText('交易审计')).toBeInTheDocument();
    expect(screen.getByText('提交请求')).toBeInTheDocument();
  });
});
