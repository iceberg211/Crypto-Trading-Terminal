/**
 * 最小名义价值规则
 * 
 * 检查订单金额是否满足最小交易金额要求
 */

import Decimal from 'decimal.js';
import type { RiskContext, RiskCheckResult, RiskRuleConfig } from '../types';

export const RULE_ID = 'MIN_NOTIONAL';
export const RULE_NAME = '最小名义价值';
export const RULE_DESCRIPTION = '订单金额必须大于最小交易金额';

export function createMinNotionalRule(config: RiskRuleConfig) {
    return {
        id: RULE_ID,
        name: RULE_NAME,
        description: RULE_DESCRIPTION,
        enabled: true,
        priority: 1,
        check: (ctx: RiskContext): RiskCheckResult => {
            const notional = new Decimal(ctx.notionalValue);
            const minNotional = new Decimal(config.minNotional);

            const pass = notional.gte(minNotional);

            return {
                ruleId: RULE_ID,
                ruleName: RULE_NAME,
                pass,
                reason: pass
                    ? undefined
                    : `订单金额 ${notional.toFixed(2)} USDT 小于最小交易金额 ${minNotional.toFixed(2)} USDT`,
                details: {
                    notionalValue: ctx.notionalValue,
                    minNotional: config.minNotional,
                },
            };
        },
    };
}
