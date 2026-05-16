import Decimal from 'decimal.js';
import type { OrderSide } from '../atoms/tradeAtom';

interface TradeFormDisplayParams {
  side: OrderSide;
  submitting: boolean;
  baseAsset: string;
  quoteAsset: string;
  balances: Record<string, string>;
  pricePrecision: number;
  quantityPrecision: number;
}

export interface TradeFormDisplay {
  availableBalance: string;
  balanceUnit: string;
  amountUnit: string;
  quoteUnit: string;
  submitLabel: string;
  symbolLabel: string;
}

export function getTradeFormDisplay(params: TradeFormDisplayParams): TradeFormDisplay {
  const isBuy = params.side === 'buy';
  const balanceUnit = isBuy ? params.quoteAsset : params.baseAsset;
  const balancePrecision = isBuy ? params.pricePrecision : params.quantityPrecision;
  const rawBalance = params.balances[balanceUnit] || '0';

  return {
    availableBalance: new Decimal(rawBalance).toFixed(balancePrecision),
    balanceUnit,
    amountUnit: params.baseAsset,
    quoteUnit: params.quoteAsset,
    submitLabel: params.submitting
      ? '处理中...'
      : `${isBuy ? '买入' : '卖出'} ${params.baseAsset}`,
    symbolLabel: `${params.baseAsset}/${params.quoteAsset}`,
  };
}
