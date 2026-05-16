import { atom } from 'jotai';
import type { Ticker24hr } from '@/types/binance';

export const tickerAtom = atom<Ticker24hr | null>(null);
export const tickerLoadingAtom = atom<boolean>(false);
export const tickerErrorAtom = atom<string | null>(null);
