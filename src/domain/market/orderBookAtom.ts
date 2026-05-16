import { atom } from 'jotai';

export type OrderBookItemType = [string, string];

export type OrderBookSyncStatus =
  | 'uninitialized'
  | 'syncing'
  | 'synchronized'
  | 'gap_detected';

export interface OrderBookState {
  lastUpdateId: number;
  bids: OrderBookItemType[];
  asks: OrderBookItemType[];
}

export const initialOrderBookState: OrderBookState = {
  lastUpdateId: 0,
  bids: [],
  asks: [],
};

export const orderBookAtom = atom<OrderBookState>(initialOrderBookState);
export const orderBookLoadingAtom = atom<boolean>(false);
export const orderBookErrorAtom = atom<string | null>(null);
export const orderBookSyncStatusAtom = atom<OrderBookSyncStatus>('uninitialized');
export const orderBookGapCountAtom = atom<number>(0);
export const orderBookBufferSizeAtom = atom<number>(0);
export const orderBookLastGapAtom = atom<{
  expected: number;
  got: number;
  lastUpdateId: number;
  time: number;
} | null>(null);
