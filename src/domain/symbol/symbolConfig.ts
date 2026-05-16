import type { SymbolConfig } from '@/core/config';

export type { SymbolConfig };

const KNOWN_QUOTE_ASSETS = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'BTC', 'ETH', 'BNB'] as const;

export const POPULAR_SYMBOLS: SymbolConfig[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 6, tickSize: '0.01', stepSize: '0.00001', minNotional: '10', minQty: '0.00001', maxQty: '9000', status: 'TRADING' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 4, tickSize: '0.01', stepSize: '0.0001', minNotional: '10', minQty: '0.0001', maxQty: '9000', status: 'TRADING' },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 3, tickSize: '0.01', stepSize: '0.001', minNotional: '10', minQty: '0.001', maxQty: '9000', status: 'TRADING' },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 2, tickSize: '0.01', stepSize: '0.01', minNotional: '10', minQty: '0.01', maxQty: '9000', status: 'TRADING' },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', pricePrecision: 4, quantityPrecision: 1, tickSize: '0.0001', stepSize: '0.1', minNotional: '10', minQty: '0.1', maxQty: '9000000', status: 'TRADING' },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', pricePrecision: 5, quantityPrecision: 0, tickSize: '0.00001', stepSize: '1', minNotional: '10', minQty: '1', maxQty: '9000000', status: 'TRADING' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', pricePrecision: 4, quantityPrecision: 1, tickSize: '0.0001', stepSize: '0.1', minNotional: '10', minQty: '0.1', maxQty: '9000000', status: 'TRADING' },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 2, tickSize: '0.01', stepSize: '0.01', minNotional: '10', minQty: '0.01', maxQty: '9000', status: 'TRADING' },
];

export function resolveSymbolAssets(symbol: string): Pick<SymbolConfig, 'baseAsset' | 'quoteAsset'> {
  const quoteAsset = KNOWN_QUOTE_ASSETS.find((asset) => symbol.endsWith(asset));

  if (!quoteAsset) {
    return {
      baseAsset: symbol,
      quoteAsset: 'USDT',
    };
  }

  return {
    baseAsset: symbol.slice(0, -quoteAsset.length),
    quoteAsset,
  };
}

export function createFallbackSymbolConfig(symbol: string): SymbolConfig {
  const { baseAsset, quoteAsset } = resolveSymbolAssets(symbol);

  return {
    symbol,
    baseAsset,
    quoteAsset,
    pricePrecision: quoteAsset === 'USDT' || quoteAsset === 'USDC' || quoteAsset === 'BUSD' ? 2 : 8,
    quantityPrecision: 4,
    tickSize: quoteAsset === 'USDT' || quoteAsset === 'USDC' || quoteAsset === 'BUSD' ? '0.01' : '0.00000001',
    stepSize: '0.0001',
    minNotional: '10',
    minQty: '0.0001',
    maxQty: '9999999',
    status: 'TRADING',
  };
}
