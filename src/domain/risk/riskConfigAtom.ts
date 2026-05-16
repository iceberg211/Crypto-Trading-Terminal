/**
 * 风控配置 Atom
 * 
 * 使用 Jotai 管理风控配置状态
 */

import { atom } from 'jotai';
import { riskEngine } from './RiskEngine';
import type { RiskRuleConfig, RiskDecision, RiskContext } from './types';
import { DEFAULT_RISK_CONFIG } from './types';

// ==================== Atoms ====================

/**
 * 风控配置 Atom
 */
export const riskConfigAtom = atom<RiskRuleConfig>(DEFAULT_RISK_CONFIG);

/**
 * 最后一次风控决策 Atom
 */
export const lastRiskDecisionAtom = atom<RiskDecision | null>(null);

/**
 * 更新风控配置
 */
export const updateRiskConfigAtom = atom(
    null,
    (get, set, config: Partial<RiskRuleConfig>) => {
        const current = get(riskConfigAtom);
        const updated = { ...current, ...config };
        riskEngine.updateConfig(updated);
        set(riskConfigAtom, updated);
    }
);

/**
 * 执行风控检查
 */
export const checkRiskAtom = atom(
    null,
    (_get, set, ctx: RiskContext) => {
        const decision = riskEngine.evaluate(ctx);
        set(lastRiskDecisionAtom, decision);
        return decision;
    }
);

/**
 * 获取拒绝原因列表
 */
export const rejectionReasonsAtom = atom((get) => {
    const decision = get(lastRiskDecisionAtom);
    if (!decision) return [];
    return riskEngine.formatRejectionReasons(decision);
});

/**
 * 清除最后一次风控决策
 */
export const clearRiskDecisionAtom = atom(null, (_get, set) => {
    set(lastRiskDecisionAtom, null);
});
