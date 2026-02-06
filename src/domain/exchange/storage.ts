import type { LifecycleEvent } from './lifecycle/types';
import type { LedgerJournal } from './ledger/types';

export const EXCHANGE_AUDIT_KEYS = {
  lifecycle: 'exchange_lifecycle_v1',
  ledger: 'exchange_ledger_v1',
} as const;

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LIFECYCLE_EVENTS = 5000;
const MAX_LEDGER_JOURNALS = 5000;

function isBrowserEnv() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function pruneByTimeAndLimit<T>(
  items: T[],
  getTimestamp: (item: T) => number,
  maxItems: number
): T[] {
  const cutoff = Date.now() - RETENTION_MS;
  const filtered = items.filter((item) => getTimestamp(item) >= cutoff);
  if (filtered.length <= maxItems) return filtered;
  const sorted = [...filtered].sort((a, b) => getTimestamp(a) - getTimestamp(b));
  return sorted.slice(sorted.length - maxItems);
}

export function pruneLifecycleEvents(events: LifecycleEvent[]): LifecycleEvent[] {
  return pruneByTimeAndLimit(events, (event) => event.timestamp, MAX_LIFECYCLE_EVENTS);
}

export function pruneLedgerJournals(journals: LedgerJournal[]): LedgerJournal[] {
  return pruneByTimeAndLimit(journals, (journal) => journal.timestamp, MAX_LEDGER_JOURNALS);
}

export function readLifecycleEvents(): LifecycleEvent[] {
  if (!isBrowserEnv()) return [];
  const parsed = safeParse<LifecycleEvent[]>(
    localStorage.getItem(EXCHANGE_AUDIT_KEYS.lifecycle),
    []
  );
  const pruned = pruneLifecycleEvents(parsed);
  if (pruned.length !== parsed.length) {
    writeLifecycleEvents(pruned);
  }
  return pruned;
}

export function writeLifecycleEvents(events: LifecycleEvent[]): void {
  if (!isBrowserEnv()) return;
  const pruned = pruneLifecycleEvents(events);
  localStorage.setItem(EXCHANGE_AUDIT_KEYS.lifecycle, JSON.stringify(pruned));
}

export function readLedgerJournals(): LedgerJournal[] {
  if (!isBrowserEnv()) return [];
  const parsed = safeParse<LedgerJournal[]>(
    localStorage.getItem(EXCHANGE_AUDIT_KEYS.ledger),
    []
  );
  const pruned = pruneLedgerJournals(parsed);
  if (pruned.length !== parsed.length) {
    writeLedgerJournals(pruned);
  }
  return pruned;
}

export function writeLedgerJournals(journals: LedgerJournal[]): void {
  if (!isBrowserEnv()) return;
  const pruned = pruneLedgerJournals(journals);
  localStorage.setItem(EXCHANGE_AUDIT_KEYS.ledger, JSON.stringify(pruned));
}
