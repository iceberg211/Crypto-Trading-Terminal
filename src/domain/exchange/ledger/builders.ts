import Decimal from 'decimal.js';
import type { LedgerJournal, LedgerJournalKind, LedgerLine } from './types';
import { assertLedgerJournal } from './validation';

interface JournalBase {
  flowId: string;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  timestamp?: number;
  meta?: Record<string, unknown>;
}

interface AssetMovement {
  asset: string;
  amount: string;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toSignedString(value: Decimal): string {
  return value.toFixed(8);
}

function makeLine(
  journalId: string,
  asset: string,
  account: LedgerLine['account'],
  delta: Decimal
): LedgerLine {
  return {
    lineId: createId('ll'),
    journalId,
    asset,
    account,
    delta: toSignedString(delta),
  };
}

function buildJournal(
  journalId: string,
  kind: LedgerJournalKind,
  base: JournalBase,
  lines: LedgerLine[],
  meta?: Record<string, unknown>
): LedgerJournal {
  const journal: LedgerJournal = {
    journalId,
    flowId: base.flowId,
    orderId: base.orderId,
    symbol: base.symbol,
    side: base.side,
    kind,
    timestamp: base.timestamp || Date.now(),
    lines,
    meta: {
      ...(base.meta || {}),
      ...(meta || {}),
    },
  };
  assertLedgerJournal(journal);
  return journal;
}

export function buildLockJournal(base: JournalBase, movement: AssetMovement): LedgerJournal {
  const amount = new Decimal(movement.amount);
  const journalId = createId('lj');
  const lines: LedgerLine[] = [
    makeLine(journalId, movement.asset, 'USER_AVAILABLE', amount.negated()),
    makeLine(journalId, movement.asset, 'USER_LOCKED', amount),
  ];
  return buildJournal(journalId, 'LOCK', base, lines, { asset: movement.asset });
}

export function buildUnlockJournal(base: JournalBase, movement: AssetMovement): LedgerJournal {
  const amount = new Decimal(movement.amount);
  const journalId = createId('lj');
  const lines: LedgerLine[] = [
    makeLine(journalId, movement.asset, 'USER_LOCKED', amount.negated()),
    makeLine(journalId, movement.asset, 'USER_AVAILABLE', amount),
  ];
  return buildJournal(journalId, 'UNLOCK', base, lines, { asset: movement.asset });
}

export function buildTradeSettleJournal(
  base: JournalBase,
  params: {
    baseAsset: string;
    quoteAsset: string;
    baseAmount: string;
    quoteAmount: string;
    tradeId: number;
  }
): LedgerJournal {
  const baseAmount = new Decimal(params.baseAmount);
  const quoteAmount = new Decimal(params.quoteAmount);
  const journalId = createId('lj');
  const lines: LedgerLine[] = [];

  if (base.side === 'BUY') {
    lines.push(makeLine(journalId, params.quoteAsset, 'USER_LOCKED', quoteAmount.negated()));
    lines.push(makeLine(journalId, params.quoteAsset, 'EXCHANGE_SPOT_POOL', quoteAmount));
    lines.push(makeLine(journalId, params.baseAsset, 'EXCHANGE_SPOT_POOL', baseAmount.negated()));
    lines.push(makeLine(journalId, params.baseAsset, 'USER_AVAILABLE', baseAmount));
  } else {
    lines.push(makeLine(journalId, params.baseAsset, 'USER_LOCKED', baseAmount.negated()));
    lines.push(makeLine(journalId, params.baseAsset, 'EXCHANGE_SPOT_POOL', baseAmount));
    lines.push(makeLine(journalId, params.quoteAsset, 'EXCHANGE_SPOT_POOL', quoteAmount.negated()));
    lines.push(makeLine(journalId, params.quoteAsset, 'USER_AVAILABLE', quoteAmount));
  }

  return buildJournal(journalId, 'TRADE_SETTLE', base, lines, {
    baseAsset: params.baseAsset,
    quoteAsset: params.quoteAsset,
    tradeId: params.tradeId,
  });
}

export function buildFeeJournal(
  base: JournalBase,
  params: {
    commissionAsset: string;
    commission: string;
    tradeId: number;
  }
): LedgerJournal | null {
  const commission = new Decimal(params.commission || '0');
  if (commission.lte(0)) return null;

  const journalId = createId('lj');
  const lines: LedgerLine[] = [
    makeLine(journalId, params.commissionAsset, 'USER_AVAILABLE', commission.negated()),
    makeLine(journalId, params.commissionAsset, 'EXCHANGE_FEE_POOL', commission),
  ];

  return buildJournal(journalId, 'FEE', base, lines, {
    commissionAsset: params.commissionAsset,
    tradeId: params.tradeId,
  });
}
