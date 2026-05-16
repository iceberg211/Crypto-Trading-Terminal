import { atom } from 'jotai';

/**
 * 交易模式: 现货 / 杠杆 / 合约
 * 切换模式只影响交易表单和订单面板，K线/订单簿/成交等共享组件不受影响
 */
export type TradingMode = 'spot' | 'margin' | 'futures';

export const tradingModeAtom = atom<TradingMode>('spot');
