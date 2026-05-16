/**
 * 价格偏离保护规则
 * 
 * 检查限价单价格是否偏离市场价格过大
 */

import Decimal from 'decimal.js';
import type { RiskContext, RiskCheckResult, RiskRuleConfig } from '../types';

export const RULE_ID = 'PRICE_DEVIATION';
export const RULE_NAME = '价格偏离保护';
export const RULE_DESCRIPTION = '限价单价格不能偏离市场价格过大';

export function createPriceDeviationRule(config: RiskRuleConfig) {
    return {
        id: RULE_ID,
        name: RULE_NAME,
        description: RULE_DESCRIPTION,
        enabled: true,
        priority: 2,
        check: (ctx: RiskContext): RiskCheckResult => {
            // 市价单不检查价格偏离
            if (ctx.orderType === 'MARKET') {
                return {
                    ruleId: RULE_ID,
                    ruleName: RULE_NAME,
                    pass: true,
                    details: { skipped: true, reason: '市价单不检查价格偏离' },
                };
            }

            const price = new Decimal(ctx.price);
            const marketPrice = new Decimal(ctx.marketPrice);

            if (marketPrice.isZero()) {
                return {
                    ruleId: RULE_ID,
                    ruleName: RULE_NAME,
                    pass: true,
                    details: { skipped: true, reason: '无市场价格数据' },
                };
            }

            // 计算偏离百分比
            const deviation = price.minus(marketPrice).abs().div(marketPrice).mul(100);
            const threshold = new Decimal(config.priceDeviationThreshold);
            const pass = deviation.lte(threshold);

            return {
                ruleId: RULE_ID,
                ruleName: RULE_NAME,
                pass,
                reason: pass
                    ? undefined
                    : `价格偏离市价 ${deviation.toFixed(2)}%，超过阈值 ${threshold.toFixed(2)}%`,
                details: {
                    price: ctx.price,
                    marketPrice: ctx.marketPrice,
                    deviation: deviation.toFixed(2),
                    threshold: config.priceDeviationThreshold,
                },
            };
        },
    };
}
