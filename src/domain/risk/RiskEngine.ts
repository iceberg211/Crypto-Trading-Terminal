/**
 * 风控规则引擎
 * 
 * 可扩展的规则引擎，支持：
 * - 动态注册/注销规则
 * - 规则优先级
 * - 全量评估或短路评估
 * - 可解释的决策结果
 */

import type { RiskRule, RiskContext, RiskDecision, RiskCheckResult, RiskRuleConfig } from './types';
import { DEFAULT_RISK_CONFIG } from './types';
import { createMinNotionalRule } from './rules/minNotionalRule';
import { createPriceDeviationRule } from './rules/priceDeviationRule';
import { createMaxOrderValueRule } from './rules/maxOrderValueRule';

export class RiskEngine {
    private rules: Map<string, RiskRule> = new Map();
    private config: RiskRuleConfig;

    constructor(config: Partial<RiskRuleConfig> = {}) {
        this.config = { ...DEFAULT_RISK_CONFIG, ...config };
        this.initDefaultRules();
    }

    /**
     * 初始化默认规则
     */
    private initDefaultRules(): void {
        const defaultRules = [
            createMinNotionalRule(this.config),
            createPriceDeviationRule(this.config),
            createMaxOrderValueRule(this.config),
        ];

        for (const rule of defaultRules) {
            this.registerRule(rule);
        }
    }

    /**
     * 更新配置并重新初始化规则
     */
    updateConfig(config: Partial<RiskRuleConfig>): void {
        this.config = { ...this.config, ...config };
        this.rules.clear();
        this.initDefaultRules();
    }

    /**
     * 获取当前配置
     */
    getConfig(): RiskRuleConfig {
        return { ...this.config };
    }

    /**
     * 注册规则
     */
    registerRule(rule: RiskRule): void {
        this.rules.set(rule.id, rule);
    }

    /**
     * 注销规则
     */
    unregisterRule(ruleId: string): void {
        this.rules.delete(ruleId);
    }

    /**
     * 启用/禁用规则
     */
    setRuleEnabled(ruleId: string, enabled: boolean): void {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = enabled;
        }
    }

    /**
     * 获取所有已注册规则
     */
    getRules(): RiskRule[] {
        return Array.from(this.rules.values())
            .sort((a, b) => a.priority - b.priority);
    }

    /**
     * 评估订单风险
     * 
     * @param ctx 风控上下文
     * @param shortCircuit 是否短路评估 (默认 false，即全量评估)
     * @returns 风控决策
     */
    evaluate(ctx: RiskContext, shortCircuit = false): RiskDecision {
        const results: RiskCheckResult[] = [];
        const triggers: RiskCheckResult[] = [];
        let allow = true;

        // 按优先级排序的规则
        const sortedRules = this.getRules();

        for (const rule of sortedRules) {
            if (!rule.enabled) continue;

            const result = rule.check(ctx);
            results.push(result);

            if (!result.pass) {
                triggers.push(result);
                allow = false;

                // 短路评估：遇到第一个失败立即返回
                if (shortCircuit) {
                    break;
                }
            }
        }

        return {
            allow,
            results,
            triggers,
            timestamp: Date.now(),
        };
    }

    /**
     * 快速检查 (短路评估)
     */
    quickCheck(ctx: RiskContext): RiskDecision {
        return this.evaluate(ctx, true);
    }

    /**
     * 格式化拒绝原因
     */
    formatRejectionReasons(decision: RiskDecision): string[] {
        return decision.triggers
            .filter((t) => t.reason)
            .map((t) => `[${t.ruleName}] ${t.reason}`);
    }
}

// 导出单例
export const riskEngine = new RiskEngine();
