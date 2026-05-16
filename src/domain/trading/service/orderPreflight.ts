import Decimal from 'decimal.js';
import { riskEngine, type RiskContext, type RiskDecision } from '@/domain/risk';
import type { NewOrderRequest, OrderResponse } from '@/domain/trading/types';

interface BuildRiskContextParams {
  request: NewOrderRequest;
  availableBalance: string;
  marketPrice: string;
}

function pickRiskPrice(request: NewOrderRequest, marketPrice: string): string {
  if (request.type === 'MARKET') {
    return marketPrice || request.price || '0';
  }

  return request.price || marketPrice || '0';
}

export function buildRiskContext(params: BuildRiskContextParams): RiskContext {
  const { request, availableBalance, marketPrice } = params;
  const price = pickRiskPrice(request, marketPrice);
  const notionalValue = new Decimal(request.quantity || '0')
    .times(new Decimal(price || '0'))
    .toString();

  return {
    symbol: request.symbol,
    side: request.side,
    orderType: request.type === 'STOP_MARKET' ? 'MARKET' : request.type,
    price,
    quantity: request.quantity,
    notionalValue,
    availableBalance,
    marketPrice: marketPrice || price,
    timestamp: Date.now(),
  };
}

export function formatRiskDecisionMessage(decision: RiskDecision): string {
  const reasons = riskEngine.formatRejectionReasons(decision);
  if (reasons.length > 0) {
    return reasons.join('；');
  }

  return '订单未通过风控检查';
}

export function toRiskRejectedResponse(decision: RiskDecision): OrderResponse {
  return {
    success: false,
    error: {
      code: 'RISK_REJECTED',
      message: formatRiskDecisionMessage(decision),
      reason: 'RISK_REJECTED',
    },
  };
}
