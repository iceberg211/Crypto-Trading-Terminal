export type LedgerAccount =
  | 'USER_AVAILABLE'
  | 'USER_LOCKED'
  | 'EXCHANGE_SPOT_POOL'
  | 'EXCHANGE_FEE_POOL';

export type LedgerJournalKind = 'LOCK' | 'UNLOCK' | 'TRADE_SETTLE' | 'FEE';

export interface LedgerLine {
  lineId: string;
  journalId: string;
  asset: string;
  account: LedgerAccount;
  delta: string;
}

export interface LedgerJournal {
  journalId: string;
  flowId: string;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  kind: LedgerJournalKind;
  timestamp: number;
  lines: LedgerLine[];
  meta?: Record<string, unknown>;
}
