import { atom } from 'jotai';
import { exchangeInfo } from '@/core/config';
import {
  createFallbackSymbolConfig,
  POPULAR_SYMBOLS,
  type SymbolConfig,
} from './symbolConfig';

export type { SymbolConfig };
export { POPULAR_SYMBOLS };

export const symbolConfigAtom = atom<SymbolConfig>(POPULAR_SYMBOLS[0]);

export const symbolAtom = atom((get) => get(symbolConfigAtom).symbol);

export const setSymbolAtom = atom(
  null,
  (_get, set, symbolString: string) => {
    const config = exchangeInfo.getSymbol(symbolString)
      || POPULAR_SYMBOLS.find((item) => item.symbol === symbolString)
      || createFallbackSymbolConfig(symbolString);

    set(symbolConfigAtom, config);
  }
);
