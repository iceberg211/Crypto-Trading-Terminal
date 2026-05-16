import { describe, expect, it } from 'vitest';
import type { RiskDecision } from '@/domain/risk';
import { buildRiskContext, toRiskRejectedResponse } from './orderPreflight';

describe('orderPreflight', () => {
  it('为限价单生成风控上下文', () => {
    const ctx = buildRiskContext({
      request: {
        symbol: 'ETHUSDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '0.5',
        price: '2000',
      },
      availableBalance: '1500',
      marketPrice: '1990',
    });

    expect(ctx).toMatchObject({
      symbol: 'ETHUSDT',
      side: 'BUY',
      orderType: 'LIMIT',
      price: '2000',
      quantity: '0.5',
      notionalValue: '1000',
      availableBalance: '1500',
      marketPrice: '1990',
    });
  });

  it('市价单用市场价估算名义价值', () => {
    const ctx = buildRiskContext({
      request: {
        symbol: 'ETHUSDT',
        side: 'SELL',
        type: 'MARKET',
        quantity: '1.2',
      },
      availableBalance: '2',
      marketPrice: '1800',
    });

    expect(ctx.price).toBe('1800');
    expect(ctx.notionalValue).toBe('2160');
  });

  it('把风控拒绝转换为订单拒绝响应', () => {
    const decision: RiskDecision = {
      allow: false,
      results: [],
      triggers: [
        {
          ruleId: 'MAX_ORDER_VALUE',
          ruleName: '单笔最大金额',
          pass: false,
          reason: '订单金额超过单笔最大限额',
        },
      ],
      timestamp: 1,
    };

    expect(toRiskRejectedResponse(decision)).toEqual({
      success: false,
      error: {
        code: 'RISK_REJECTED',
        message: '[单笔最大金额] 订单金额超过单笔最大限额',
        reason: 'RISK_REJECTED',
      },
    });
  });
});
