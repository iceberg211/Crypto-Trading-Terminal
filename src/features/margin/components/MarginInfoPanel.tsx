import { memo } from 'react';
import {
    defaultMarginAccount,
    getRiskLevel,
    RISK_COLORS,
    RISK_BG_COLORS,
    RISK_LABELS,
} from '../data/marginMockData';

/**
 * 杠杆风险指标面板
 * 展示保证金率、风险等级、预估强平价
 */
export const MarginInfoPanel = memo(function MarginInfoPanel() {
    const account = defaultMarginAccount;
    const riskLevel = getRiskLevel(account.marginRatio);
    const riskColor = RISK_COLORS[riskLevel];
    const riskBg = RISK_BG_COLORS[riskLevel];
    const riskLabel = RISK_LABELS[riskLevel];

    // 保证金率映射到进度条（0~3 区间映射到 0~100%）
    const ratioPercent = Math.min((account.marginRatio / 3) * 100, 100);

    return (
        <div className="p-3 space-y-3 bg-bg-card border-t border-line-dark">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-primary">风险信息</span>
                <span className={`inline-flex items-center gap-1 text-xxs font-medium ${riskColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${riskBg}`} />
                    {riskLabel}
                </span>
            </div>

            {/* 保证金率进度条 */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">保证金率</span>
                    <span className={`font-mono font-medium ${riskColor}`}>
                        {account.marginRatio >= 999 ? '∞' : `${(account.marginRatio * 100).toFixed(1)}%`}
                    </span>
                </div>
                <div className="h-1.5 bg-bg-soft rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${riskBg}`}
                        style={{ width: `${ratioPercent}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-text-tertiary">
                    <span>强平</span>
                    <span>安全</span>
                </div>
            </div>

            {/* 详细指标 */}
            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                    <span className="text-text-secondary">净资产</span>
                    <span className="text-text-primary font-mono">{account.netAsset} USDT</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">总负债</span>
                    <span className="text-text-primary font-mono">{account.totalDebt} USDT</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">预估强平价</span>
                    <span className={`font-mono font-medium ${account.liquidationPrice === '--' ? 'text-text-tertiary' : 'text-down'}`}>
                        {account.liquidationPrice}
                    </span>
                </div>
            </div>

            {/* 警告提示 */}
            {riskLevel === 'warning' && (
                <div className="p-2 rounded-sm bg-yellow-400/10 border border-yellow-400/20">
                    <p className="text-xxs text-yellow-400">
                        ⚠ 保证金率接近强平线，请注意追加保证金或减少仓位
                    </p>
                </div>
            )}
            {riskLevel === 'danger' && (
                <div className="p-2 rounded-sm bg-down/10 border border-down/20">
                    <p className="text-xxs text-down">
                        🚨 保证金率极低！即将触发强制平仓，请立即补充保证金
                    </p>
                </div>
            )}
        </div>
    );
});
