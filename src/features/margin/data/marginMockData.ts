/**
 * 杠杆交易 Mock 数据
 * 仅用于 UI 面板展示，不涉及任何真实借贷逻辑
 */

export type LeverageLevel = 3 | 5 | 10;

export interface MarginAccountMock {
    /** 净资产（USDT） */
    netAsset: string;
    /** 总负债（USDT） */
    totalDebt: string;
    /** 保证金率 (0~1，>1 表示安全) */
    marginRatio: number;
    /** 可借额度 */
    borrowable: Record<string, string>;
    /** 当前杠杆 */
    leverage: LeverageLevel;
    /** 预估强平价 */
    liquidationPrice: string;
}

/** 默认 Mock 杠杆账户 */
export const defaultMarginAccount: MarginAccountMock = {
    netAsset: '10000.00',
    totalDebt: '0.00',
    marginRatio: 999,
    borrowable: {
        USDT: '30000.00',
        BTC: '0.50',
        ETH: '8.00',
    },
    leverage: 3,
    liquidationPrice: '--',
};

/** 借贷利率（年化） */
export const BORROW_RATES: Record<string, string> = {
    USDT: '10.95',
    BTC: '3.65',
    ETH: '5.48',
};

/** 可选杠杆倍数 */
export const LEVERAGE_OPTIONS: LeverageLevel[] = [3, 5, 10];

/** 风险等级 */
export type RiskLevel = 'safe' | 'warning' | 'danger';

export function getRiskLevel(ratio: number): RiskLevel {
    if (ratio >= 2) return 'safe';
    if (ratio >= 1.3) return 'warning';
    return 'danger';
}

export const RISK_COLORS: Record<RiskLevel, string> = {
    safe: 'text-up',
    warning: 'text-yellow-400',
    danger: 'text-down',
};

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
    safe: 'bg-up',
    warning: 'bg-yellow-400',
    danger: 'bg-down',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
    safe: '安全',
    warning: '警告',
    danger: '危险',
};
