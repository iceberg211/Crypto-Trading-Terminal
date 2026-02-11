/**
 * 费率引擎类型定义
 */

/**
 * VIP 等级
 */
export type VIPLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * 费率配置
 */
export interface FeeConfig {
    /** maker 费率 (挂单) */
    makerRate: string;
    /** taker 费率 (吃单) */
    takerRate: string;
    /** VIP 等级 */
    vipLevel: VIPLevel;
    /** 平台币折扣开关 */
    bnbDiscount: boolean;
    /** 折扣比例 0-0.25 */
    discountRate: number;
}

/**
 * 费率分解说明
 */
export interface FeeBreakdown {
    /** 规则名称 */
    rule: string;
    /** 规则说明 */
    description: string;
    /** 费率变化 */
    rateChange: string;
}

/**
 * 费率计算结果
 */
export interface FeeResult {
    /** 是否为 maker */
    isMaker: boolean;
    /** 基础费率 */
    baseRate: string;
    /** 最终费率 */
    finalRate: string;
    /** 手续费金额 */
    amount: string;
    /** 费率来源解释 */
    breakdown: FeeBreakdown[];
}

/**
 * VIP 等级费率表
 * 参考 Binance VIP 费率
 */
export const VIP_FEE_TABLE: Record<VIPLevel, { maker: string; taker: string }> = {
    0: { maker: '0.001', taker: '0.001' },     // 0.1% / 0.1%
    1: { maker: '0.0009', taker: '0.001' },    // 0.09% / 0.1%
    2: { maker: '0.0008', taker: '0.001' },    // 0.08% / 0.1%
    3: { maker: '0.0007', taker: '0.0009' },   // 0.07% / 0.09%
    4: { maker: '0.0006', taker: '0.0008' },   // 0.06% / 0.08%
    5: { maker: '0.0005', taker: '0.0007' },   // 0.05% / 0.07%
};

/**
 * 默认费率配置
 */
export const DEFAULT_FEE_CONFIG: FeeConfig = {
    makerRate: '0.001',
    takerRate: '0.001',
    vipLevel: 0,
    bnbDiscount: false,
    discountRate: 0.25, // 25% 折扣
};
