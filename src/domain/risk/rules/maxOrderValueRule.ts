/**
 * 最大订单金额规则
 * 
 * 检查单笔订单是否超过最大限额
 */

import Decimal from 'decimal.js';
import type { RiskContext, RiskCheckResult, RiskRuleConfig } from '../types';

export const RULE_ID = 'MAX_ORDER_VALUE';
export const RULE_NAME = '单笔最大金额';
export const RULE_DESCRIPTION = '单笔订单金额不能超过最大限额';

export function createMaxOrderValueRule(config: RiskRuleConfig) {
    return {
        id: RULE_ID,
        name: RULE_NAME,
        description: RULE_DESCRIPTION,
        enabled: true,
        priority: 3,
        check: (ctx: RiskContext): RiskCheckResult => {
            const notional = new Decimal(ctx.notionalValue);
            const maxValue = new Decimal(config.maxOrderValue);

            const pass = notional.lte(maxValue);

            return {
                ruleId: RULE_ID,
                ruleName: RULE_NAME,
                pass,
                reason: pass
                    ? undefined
                    : `订单金额 ${notional.toFixed(2)} USDT 超过单笔最大限额 ${maxValue.toFixed(2)} USDT`,
                details: {
                    notionalValue: ctx.notionalValue,
                    maxOrderValue: config.maxOrderValue,
                },
            };
        },
    };
}
