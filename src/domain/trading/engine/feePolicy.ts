import Decimal from 'decimal.js';
import { feeEngine } from '@/domain/fee';
import type { OrderSide } from '@/domain/trading/types';

interface CalculateFillFeeParams {
  quoteQty: string;
  baseQty: string;
  isMaker: boolean;
  side: OrderSide;
  baseAsset: string;
  quoteAsset: string;
}

export interface FillFeeResult {
  commission: string;
  commissionAsset: string;
  finalRate: string;
  isMaker: boolean;
}

export function calculateFillFee(params: CalculateFillFeeParams): FillFeeResult {
  const feeResult = feeEngine.calculate(params.quoteQty, params.isMaker);
  const finalRate = new Decimal(feeResult.finalRate);

  if (params.side === 'BUY') {
    return {
      commission: new Decimal(params.baseQty).times(finalRate).toFixed(8),
      commissionAsset: params.baseAsset,
      finalRate: feeResult.finalRate,
      isMaker: params.isMaker,
    };
  }

  return {
    commission: new Decimal(params.quoteQty).times(finalRate).toFixed(8),
    commissionAsset: params.quoteAsset,
    finalRate: feeResult.finalRate,
    isMaker: params.isMaker,
  };
}
