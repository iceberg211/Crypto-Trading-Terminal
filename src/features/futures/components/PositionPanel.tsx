import { memo } from 'react';
import { mockPositions, type FuturesPosition } from '../data/futuresMockData';

function PositionRow({ pos }: { pos: FuturesPosition }) {
    const isLong = pos.side === 'long';
    const isPnlPositive = pos.unrealizedPnl.startsWith('+');

    return (
        <div className="px-3 py-2 border-b border-line-dark/50 hover:bg-bg-soft/40 transition-colors">
            {/* 第一行: 交易对 + 方向 + 杠杆 */}
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">{pos.symbol}</span>
                    <span
                        className={[
                            'px-1.5 py-0.5 text-[10px] font-medium rounded-sm',
                            isLong ? 'text-up bg-up/10' : 'text-down bg-down/10',
                        ].join(' ')}
                    >
                        {isLong ? '多' : '空'} {pos.leverage}x
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                        {pos.marginType === 'cross' ? '全仓' : '逐仓'}
                    </span>
                </div>
                <span
                    className={[
                        'text-xs font-mono font-medium',
                        isPnlPositive ? 'text-up' : 'text-down',
                    ].join(' ')}
                >
                    {pos.unrealizedPnl} USDT
                </span>
            </div>

            {/* 第二行: 数量 + 入场价 + 标记价 */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                    <div className="text-text-tertiary">数量</div>
                    <div className="text-text-primary font-mono">{pos.quantity}</div>
                </div>
                <div>
                    <div className="text-text-tertiary">入场价</div>
                    <div className="text-text-primary font-mono">{pos.entryPrice}</div>
                </div>
                <div>
                    <div className="text-text-tertiary">标记价</div>
                    <div className="text-text-primary font-mono">{pos.markPrice}</div>
                </div>
            </div>

            {/* 第三行: 保证金 + 收益率 + 强平价 */}
            <div className="grid grid-cols-3 gap-2 text-[11px] mt-1">
                <div>
                    <div className="text-text-tertiary">保证金</div>
                    <div className="text-text-primary font-mono">{pos.margin}</div>
                </div>
                <div>
                    <div className="text-text-tertiary">收益率</div>
                    <div className={`font-mono font-medium ${isPnlPositive ? 'text-up' : 'text-down'}`}>
                        {pos.pnlPercent}%
                    </div>
                </div>
                <div>
                    <div className="text-text-tertiary">强平价</div>
                    <div className="text-yellow-400 font-mono">{pos.liquidationPrice}</div>
                </div>
            </div>

            {/* 平仓按钮 */}
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    className="flex-1 h-6 text-xxs rounded-sm border border-line-dark text-text-secondary hover:text-text-primary hover:bg-bg-soft/60 transition-colors"
                >
                    限价平仓
                </button>
                <button
                    type="button"
                    className="flex-1 h-6 text-xxs rounded-sm border border-down/30 text-down hover:bg-down/10 transition-colors"
                >
                    市价平仓
                </button>
            </div>
        </div>
    );
}

/**
 * 仓位面板
 * 展示 Mock 持仓列表和盈亏信息
 */
export const PositionPanel = memo(function PositionPanel() {
    const positions = mockPositions;
    const totalPnl = positions.reduce(
        (sum, p) => sum + parseFloat(p.unrealizedPnl),
        0
    );

    return (
        <div className="flex flex-col h-full bg-bg-card">
            {/* Header */}
            <div className="px-3 h-7 border-b border-line-dark flex justify-between items-center bg-bg-panel">
                <span className="text-xs font-medium text-text-primary">
                    当前持仓 <span className="text-text-tertiary ml-1">({positions.length})</span>
                </span>
                <span
                    className={[
                        'text-xs font-mono font-medium',
                        totalPnl >= 0 ? 'text-up' : 'text-down',
                    ].join(' ')}
                >
                    {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDT
                </span>
            </div>

            {/* Position List */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {positions.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
                        暂无持仓
                    </div>
                ) : (
                    positions.map((pos) => <PositionRow key={pos.id} pos={pos} />)
                )}
            </div>
        </div>
    );
});
