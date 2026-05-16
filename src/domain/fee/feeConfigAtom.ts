/**
 * 费率配置 Atom
 * 
 * 使用 Jotai 管理费率配置状态
 */

import { atom } from 'jotai';
import { feeEngine } from './FeeEngine';
import type { FeeConfig, FeeResult, VIPLevel } from './types';
import { DEFAULT_FEE_CONFIG } from './types';

// ==================== Atoms ====================

/**
 * 费率配置 Atom
 */
export const feeConfigAtom = atom<FeeConfig>(DEFAULT_FEE_CONFIG);

/**
 * VIP 等级 Atom
 */
export const vipLevelAtom = atom(
    (get) => get(feeConfigAtom).vipLevel,
    (_get, set, level: VIPLevel) => {
        feeEngine.setVIPLevel(level);
        set(feeConfigAtom, feeEngine.getConfig());
    }
);

/**
 * 平台币折扣 Atom
 */
export const bnbDiscountAtom = atom(
    (get) => get(feeConfigAtom).bnbDiscount,
    (_get, set, enabled: boolean) => {
        feeEngine.toggleBNBDiscount(enabled);
        set(feeConfigAtom, feeEngine.getConfig());
    }
);

/**
 * 费率预估 Atom (用于交易表单)
 */
export const feeEstimateAtom = atom<{
    price: string;
    quantity: string;
    isMaker: boolean;
} | null>(null);

/**
 * 费率计算结果派生 Atom
 */
export const feeResultAtom = atom<FeeResult | null>((get) => {
    const estimate = get(feeEstimateAtom);
    if (!estimate || !estimate.price || !estimate.quantity) {
        return null;
    }

    const { price, quantity, isMaker } = estimate;
    return feeEngine.estimate(price, quantity, isMaker);
});

/**
 * 更新费率预估参数
 */
export const updateFeeEstimateAtom = atom(
    null,
    (_get, set, params: { price: string; quantity: string; isMaker: boolean }) => {
        set(feeEstimateAtom, params);
    }
);

/**
 * 格式化费率显示
 */
export const formatFeeRate = (rate: string): string => {
    return feeEngine.formatRate(rate);
};

/**
 * 获取 VIP 信息
 */
export const getVIPInfo = () => feeEngine.getVIPInfo();
