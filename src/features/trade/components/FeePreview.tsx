/**
 * 费率预览组件
 * 
 * 显示预估手续费和费率明细
 * 遵循 Vercel React Best Practices:
 * - bundle-dynamic-imports: 组件轻量，无需动态导入
 * - rerender-memo: 使用 memo 避免不必要的重渲染
 * - rendering-conditional-render: 使用三元表达式
 */

import { memo, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import Decimal from 'decimal.js';
import { feeConfigAtom } from '@/domain/fee';
import { calculateFillFee, type FillFeeResult } from '@/domain/trading/engine/feePolicy';

interface FeePreviewProps {
    /** 价格 */
    price: string;
    /** 数量 */
    quantity: string;
    /** 买/卖方向 */
    side: 'buy' | 'sell';
    /** 基础资产 */
    baseAsset: string;
    /** 报价资产 */
    quoteAsset: string;
    /** 是否为市价单 (默认为 taker) */
    isMarketOrder?: boolean;
}

/**
 * 费率预览组件
 */
export const FeePreview = memo(function FeePreview({
    price,
    quantity,
    side,
    baseAsset,
    quoteAsset,
    isMarketOrder = false,
}: FeePreviewProps) {
    const feeConfig = useAtomValue(feeConfigAtom);

    // 计算费率结果
    const feeResult: FillFeeResult | null = useMemo(() => {
        // 验证输入
        if (!price || !quantity) return null;

        const priceNum = parseFloat(price);
        const quantityNum = parseFloat(quantity);

        if (isNaN(priceNum) || isNaN(quantityNum) || priceNum <= 0 || quantityNum <= 0) {
            return null;
        }

        // 市价单默认为 taker
        const isMaker = !isMarketOrder;
        const quoteQty = new Decimal(price).times(quantity).toString();

        return calculateFillFee({
            quoteQty,
            baseQty: quantity,
            isMaker,
            side: side === 'buy' ? 'BUY' : 'SELL',
            baseAsset,
            quoteAsset,
        });
    }, [baseAsset, price, quantity, quoteAsset, side, isMarketOrder, feeConfig]);

    // 无数据时不渲染
    if (!feeResult) {
        return null;
    }

    const feeAmount = new Decimal(feeResult.commission);
    const displayAmount = feeAmount.lt(0.00000001) ? '< 0.00000001' : feeAmount.toFixed(8);

    return (
        <div className="space-y-1.5">
            {/* 预估手续费 */}
            <div className="flex justify-between text-xs">
                <span className="text-text-secondary">预估手续费</span>
                <span className="font-mono text-text-primary">
                    {displayAmount}{' '}
                    <span className="text-text-tertiary">
                        {feeResult.commissionAsset}
                    </span>
                </span>
            </div>

            {/* 费率明细 */}
            <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">
                    费率 ({feeResult.isMaker ? 'Maker' : 'Taker'})
                </span>
                <span className="font-mono text-text-secondary">
                    {new Decimal(feeResult.finalRate).mul(100).toFixed(4)}%
                </span>
            </div>

            {/* VIP 等级和折扣信息 */}
            {feeConfig.vipLevel > 0 || feeConfig.bnbDiscount ? (
                <div className="flex items-center gap-1.5 text-[10px]">
                    {feeConfig.vipLevel > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                            VIP{feeConfig.vipLevel}
                        </span>
                    ) : null}
                    {feeConfig.bnbDiscount ? (
                        <span className="px-1.5 py-0.5 rounded bg-up/15 text-up">
                            BNB 抵扣
                        </span>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
});

export default FeePreview;
