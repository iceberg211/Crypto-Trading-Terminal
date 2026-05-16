import { atom } from 'jotai';
import {
  appendLifecycleEventAtom,
  clearLifecycleEventsAtom,
  getEventsByOrderAtom,
  lifecycleEventsAtom,
  lifecycleOrderIdsAtom,
  pruneLifecycleEventsAtom,
  flowSummariesAtom,
} from './lifecycle/lifecycleAtom';
import {
  appendLedgerJournalAtom,
  clearLedgerJournalsAtom,
  getJournalsByOrderAtom,
  ledgerJournalsAtom,
  ledgerOrderIdsAtom,
  pruneLedgerJournalsAtom,
} from './ledger/ledgerAtom';

export type { LifecycleEvent, LifecycleStage, FlowSummary } from './lifecycle/types';
export type { LedgerJournal, LedgerLine, LedgerAccount, LedgerJournalKind } from './ledger/types';
export {
  buildFeeJournal,
  buildLockJournal,
  buildTradeSettleJournal,
  buildUnlockJournal,
} from './ledger/builders';
export { validateLedgerJournal, assertLedgerJournal } from './ledger/validation';
export {
  EXCHANGE_AUDIT_KEYS,
  pruneLedgerJournals,
  pruneLifecycleEvents,
  readLedgerJournals,
  readLifecycleEvents,
  writeLedgerJournals,
  writeLifecycleEvents,
} from './storage';
export {
  lifecycleEventsAtom,
  appendLifecycleEventAtom,
  pruneLifecycleEventsAtom,
  getEventsByOrderAtom,
  flowSummariesAtom,
};
export {
  ledgerJournalsAtom,
  appendLedgerJournalAtom,
  pruneLedgerJournalsAtom,
  getJournalsByOrderAtom,
};

export const exchangeAuditOrderIdsAtom = atom((get) => {
  const ids = new Set<number>();
  for (const id of get(lifecycleOrderIdsAtom)) ids.add(id);
  for (const id of get(ledgerOrderIdsAtom)) ids.add(id);
  return Array.from(ids).sort((a, b) => b - a);
});

export const pruneExchangeAuditAtom = atom(
  null,
  (_get, set) => {
    set(pruneLifecycleEventsAtom);
    set(pruneLedgerJournalsAtom);
  }
);

export const clearExchangeAuditAtom = atom(
  null,
  (_get, set) => {
    set(clearLifecycleEventsAtom);
    set(clearLedgerJournalsAtom);
  }
);

export const getExchangeAuditByOrderAtom = atom((get) => {
  const getEvents = get(getEventsByOrderAtom);
  const getJournals = get(getJournalsByOrderAtom);
  return (orderId: number) => ({
    events: getEvents(orderId),
    journals: getJournals(orderId),
  });
});

export const exchangeAuditStatsAtom = atom((get) => ({
  events: get(lifecycleEventsAtom).length,
  journals: get(ledgerJournalsAtom).length,
  flows: get(flowSummariesAtom).length,
}));
