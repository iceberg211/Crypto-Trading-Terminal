export type LifecycleStage =
  | 'ORDER_SUBMIT_REQUESTED'
  | 'ORDER_VALIDATED'
  | 'FUNDS_LOCKED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_REJECTED'
  | 'ORDER_TRIGGERED'
  | 'ORDER_PARTIALLY_FILLED'
  | 'ORDER_FILLED'
  | 'ORDER_CANCELED'
  | 'FUNDS_UNLOCKED'
  | 'TRADE_SETTLED'
  | 'LEDGER_POSTED';

export interface LifecycleEvent {
  eventId: string;
  flowId: string;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  stage: LifecycleStage;
  timestamp: number;
  payload?: Record<string, unknown>;
}

export interface FlowSummary {
  flowId: string;
  orderId: number;
  status: 'OPEN' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  updatedAt: number;
  latestStage: LifecycleStage;
}

export interface AppendLifecycleEventInput {
  flowId: string;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  stage: LifecycleStage;
  payload?: Record<string, unknown>;
  eventId?: string;
  timestamp?: number;
}
