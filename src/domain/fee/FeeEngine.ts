/**
 * 费率引擎
 * 
 * 支持：
 * - maker/taker 费率区分
 * - VIP 等级费率
 * - 平台币折扣
 * - 费率来源可解释
 */

import Decimal from 'decimal.js';
import type { FeeConfig, FeeResult, FeeBreakdown, VIPLevel } from './types';
import { VIP_FEE_TABLE, DEFAULT_FEE_CONFIG } from './types';

export class FeeEngine {
    private config: FeeConfig;

    constructor(config: Partial<FeeConfig> = {}) {
        this.config = { ...DEFAULT_FEE_CONFIG, ...config };
    }

    /**
     * 更新配置
     */
    updateConfig(config: Partial<FeeConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * 获取当前配置
     */
    getConfig(): FeeConfig {
        return { ...this.config };
    }

    /**
     * 设置 VIP 等级
     */
    setVIPLevel(level: VIPLevel): void {
        const vipRates = VIP_FEE_TABLE[level];
        this.config = {
            ...this.config,
            vipLevel: level,
            makerRate: vipRates.maker,
            takerRate: vipRates.taker,
        };
    }

    /**
     * 切换平台币折扣
     */
    toggleBNBDiscount(enabled: boolean): void {
        this.config.bnbDiscount = enabled;
    }

    /**
     * 计算手续费
     * 
     * @param tradeValue - 交易金额 (price * quantity)
     * @param isMaker - 是否为 maker 单
     * @returns 费率计算结果
     */
    calculate(tradeValue: string, isMaker: boolean): FeeResult {
        const breakdown: FeeBreakdown[] = [];

        // 1. 获取基础费率
        const baseRate = isMaker ? this.config.makerRate : this.config.takerRate;
        breakdown.push({
            rule: 'BASE_RATE',
            description: `基础费率 (${isMaker ? 'Maker' : 'Taker'})`,
            rateChange: baseRate,
        });

        // 2. VIP 等级费率 (已在 baseRate 中体现)
        if (this.config.vipLevel > 0) {
            breakdown.push({
                rule: 'VIP_RATE',
                description: `VIP ${this.config.vipLevel} 等级费率`,
                rateChange: baseRate,
            });
        }

        // 3. 计算最终费率
        let finalRate = new Decimal(baseRate);

        // 4. 平台币折扣
        if (this.config.bnbDiscount) {
            const discount = new Decimal(1).minus(this.config.discountRate);
            finalRate = finalRate.mul(discount);
            breakdown.push({
                rule: 'BNB_DISCOUNT',
                description: `平台币抵扣 ${this.config.discountRate * 100}% 折扣`,
                rateChange: `-${new Decimal(baseRate).mul(this.config.discountRate).toFixed(6)}`,
            });
        }

        // 5. 计算手续费金额
        const amount = new Decimal(tradeValue).mul(finalRate);

        return {
            isMaker,
            baseRate,
            finalRate: finalRate.toFixed(6),
            amount: amount.toFixed(8),
            breakdown,
        };
    }

    /**
     * 预估手续费 (用于下单前显示)
     */
    estimate(price: string, quantity: string, isMaker: boolean): FeeResult {
        const tradeValue = new Decimal(price).mul(quantity).toString();
        return this.calculate(tradeValue, isMaker);
    }

    /**
     * 格式化费率显示
     */
    formatRate(rate: string): string {
        const percent = new Decimal(rate).mul(100);
        return `${percent.toFixed(4)}%`;
    }

    /**
     * 格式化 VIP 等级信息
     */
    getVIPInfo(): { level: VIPLevel; maker: string; taker: string } {
        const vipRates = VIP_FEE_TABLE[this.config.vipLevel];
        return {
            level: this.config.vipLevel,
            maker: this.formatRate(vipRates.maker),
            taker: this.formatRate(vipRates.taker),
        };
    }
}

// 导出单例
export const feeEngine = new FeeEngine();
