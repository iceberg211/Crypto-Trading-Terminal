/**
 * 合约交易 Mock 数据
 * 仅用于 UI 面板展示，不涉及任何真实合约引擎
 */

export type PositionSide = 'long' | 'short';
export type MarginType = 'cross' | 'isolated';

export interface FuturesPosition {
    id: string;
    symbol: string;
    side: PositionSide;
    entryPrice: string;
    markPrice: string;
    quantity: string;
    leverage: number;
    marginType: MarginType;
    margin: string;
    unrealizedPnl: string;
    pnlPercent: string;
    liquidationPrice: string;
}

export interface FundingInfo {
    /** 当前资金费率 */
    rate: string;
    /** 下次结算时间（Unix ms） */
    nextFundingTime: number;
    /** 标记价格 */
    markPrice: string;
    /** 指数价格 */
    indexPrice: string;
}

/** Mock 持仓数据 */
export const mockPositions: FuturesPosition[] = [
    {
        id: 'pos_1',
        symbol: 'BTCUSDT',
        side: 'long',
        entryPrice: '96500.00',
        markPrice: '97200.00',
        quantity: '0.1',
        leverage: 20,
        marginType: 'cross',
        margin: '482.50',
        unrealizedPnl: '+70.00',
        pnlPercent: '+14.51',
        liquidationPrice: '91850.00',
    },
    {
        id: 'pos_2',
        symbol: 'ETHUSDT',
        side: 'short',
        entryPrice: '2680.00',
        markPrice: '2650.00',
        quantity: '1.5',
        leverage: 10,
        marginType: 'isolated',
        margin: '402.00',
        unrealizedPnl: '+45.00',
        pnlPercent: '+11.19',
        liquidationPrice: '2940.00',
    },
];

/** Mock 资金费率 */
export function getMockFundingInfo(): FundingInfo {
    // 下次结算时间：距当前最近的 8 小时整点
    const now = Date.now();
    const eightHoursMs = 8 * 60 * 60 * 1000;
    const nextFunding = Math.ceil(now / eightHoursMs) * eightHoursMs;

    return {
        rate: '0.0100',
        nextFundingTime: nextFunding,
        markPrice: '97200.00',
        indexPrice: '97195.50',
    };
}

/** 杠杆滑块刻度 */
export const LEVERAGE_MARKS = [1, 2, 5, 10, 20, 50, 75, 100, 125];

/** 默认合约杠杆 */
export const DEFAULT_FUTURES_LEVERAGE = 20;
