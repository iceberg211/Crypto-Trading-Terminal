import { atom } from 'jotai';
import { pruneLedgerJournals, readLedgerJournals, writeLedgerJournals } from '../storage';
import type { LedgerJournal } from './types';
import { assertLedgerJournal } from './validation';

const initialJournals = readLedgerJournals();

export const ledgerJournalsAtom = atom<LedgerJournal[]>(initialJournals);

export const appendLedgerJournalAtom = atom(
  null,
  (get, set, journal: LedgerJournal) => {
    assertLedgerJournal(journal);
    const journals = get(ledgerJournalsAtom);
    const next = pruneLedgerJournals([...journals, journal]);
    set(ledgerJournalsAtom, next);
    writeLedgerJournals(next);
  }
);

export const pruneLedgerJournalsAtom = atom(
  null,
  (get, set) => {
    const next = pruneLedgerJournals(get(ledgerJournalsAtom));
    set(ledgerJournalsAtom, next);
    writeLedgerJournals(next);
  }
);

export const clearLedgerJournalsAtom = atom(
  null,
  (_get, set) => {
    set(ledgerJournalsAtom, []);
    writeLedgerJournals([]);
  }
);

export const getJournalsByOrderAtom = atom(
  (get) => (orderId: number): LedgerJournal[] =>
    get(ledgerJournalsAtom)
      .filter((journal) => journal.orderId === orderId)
      .sort((a, b) => a.timestamp - b.timestamp)
);

export const ledgerOrderIdsAtom = atom((get): number[] => {
  const ids = new Set<number>();
  for (const journal of get(ledgerJournalsAtom)) {
    ids.add(journal.orderId);
  }
  return Array.from(ids).sort((a, b) => b - a);
});
