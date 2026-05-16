/**
 * 风控规则引擎类型定义
 */

/**
 * 风控上下文
 */
export interface RiskContext {
    /** 交易对 */
    symbol: string;
    /** 买卖方向 */
    side: 'BUY' | 'SELL';
    /** 订单类型 */
    orderType: 'LIMIT' | 'MARKET' | 'STOP_LIMIT';
    /** 价格 */
    price: string;
    /** 数量 */
    quantity: string;
    /** 交易金额 */
    notionalValue: string;
    /** 当前可用余额 */
    availableBalance: string;
    /** 当前市场价格 */
    marketPrice: string;
    /** 用户 ID (可选) */
    userId?: string;
    /** 时间戳 */
    timestamp: number;
}

/**
 * 风控规则检查结果
 */
export interface RiskCheckResult {
    /** 规则 ID */
    ruleId: string;
    /** 规则名称 */
    ruleName: string;
    /** 是否通过 */
    pass: boolean;
    /** 拒绝原因 (若未通过) */
    reason?: string;
    /** 详细信息 */
    details?: Record<string, unknown>;
}

/**
 * 风控决策
 */
export interface RiskDecision {
    /** 是否允许下单 */
    allow: boolean;
    /** 所有规则检查结果 */
    results: RiskCheckResult[];
    /** 触发的规则 (未通过的) */
    triggers: RiskCheckResult[];
    /** 决策时间戳 */
    timestamp: number;
}

/**
 * 风控规则接口
 */
export interface RiskRule {
    /** 规则 ID */
    id: string;
    /** 规则名称 */
    name: string;
    /** 规则描述 */
    description: string;
    /** 是否启用 */
    enabled: boolean;
    /** 优先级 (数字越小优先级越高) */
    priority: number;
    /** 检查函数 */
    check: (ctx: RiskContext) => RiskCheckResult;
}

/**
 * 风控规则配置
 */
export interface RiskRuleConfig {
    /** 最小名义价值 (USDT) */
    minNotional: string;
    /** 价格偏离保护阈值 (百分比) */
    priceDeviationThreshold: number;
    /** 下单频率限制 (每分钟) */
    orderRateLimit: number;
    /** 单笔最大金额 (USDT) */
    maxOrderValue: string;
}

/**
 * 默认风控配置
 */
export const DEFAULT_RISK_CONFIG: RiskRuleConfig = {
    minNotional: '10',           // 最小 10 USDT
    priceDeviationThreshold: 5,  // 5% 偏离保护
    orderRateLimit: 10,          // 每分钟最多 10 笔
    maxOrderValue: '100000',     // 单笔最大 10 万 USDT
};
