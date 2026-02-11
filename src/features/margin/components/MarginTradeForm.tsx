import { useState, memo } from 'react';
import {
    defaultMarginAccount,
    LEVERAGE_OPTIONS,
    type LeverageLevel,
    type MarginAccountMock,
} from '../data/marginMockData';
import Decimal from 'decimal.js';

// 杠杆倍数选择器
function LeverageSelector({
    selected,
    onSelect,
}: {
    selected: LeverageLevel;
    onSelect: (level: LeverageLevel) => void;
}) {
    return (
        <div className="flex items-center gap-1 p-1 bg-bg-panel border border-line-dark rounded-sm">
            {LEVERAGE_OPTIONS.map((lev) => (
                <button
                    key={lev}
                    type="button"
                    onClick={() => onSelect(lev)}
                    className={[
                        'flex-1 h-7 text-xs font-medium rounded-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35',
                        selected === lev
                            ? 'bg-up/15 text-up border border-up/40'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-soft/40 border border-transparent',
                    ].join(' ')}
                >
                    {lev}x
                </button>
            ))}
        </div>
    );
}

// 百分比按钮组
function PercentageButtons({
    selected,
    onSelect,
}: {
    selected: number;
    onSelect: (p: number) => void;
}) {
    const percentages = [25, 50, 75, 100];
    return (
        <div className="grid grid-cols-4 gap-1.5">
            {percentages.map((p) => (
                <button
                    key={p}
                    onClick={() => onSelect(p)}
                    className={[
                        'h-7 text-xxs rounded-sm border transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35',
                        selected === p
                            ? 'border-up/70 text-up bg-up/15'
                            : 'border-line-dark text-text-secondary hover:text-text-primary hover:bg-bg-soft/40',
                    ].join(' ')}
                >
                    {p}%
                </button>
            ))}
        </div>
    );
}

/**
 * 杠杆交易表单
 * 流式布局（不使用 flex h-full），确保在滚动容器中正常展示所有内容
 */
export const MarginTradeForm = memo(function MarginTradeForm() {
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [leverage, setLeverage] = useState<LeverageLevel>(3);
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [total, setTotal] = useState('');
    const [percentage, setPercentage] = useState(0);
    const [account] = useState<MarginAccountMock>({
        ...defaultMarginAccount,
        leverage,
    });

    // Mock 计算可借额度（基于杠杆）
    const borrowable = side === 'buy'
        ? new Decimal(account.borrowable.USDT || '0').mul(leverage).div(3).toFixed(2)
        : new Decimal(account.borrowable.BTC || '0').mul(leverage).div(3).toFixed(6);
    const borrowUnit = side === 'buy' ? 'USDT' : 'BTC';

    const availableBalance = side === 'buy' ? '10000.00' : '0.500000';
    const balanceUnit = side === 'buy' ? 'USDT' : 'BTC';

    return (
        <div className="bg-bg-card">
            {/* Header Tabs - Buy/Sell */}
            <div className="flex border-b border-line-dark bg-bg-panel h-8">
                <button
                    onClick={() => setSide('buy')}
                    className={[
                        'flex-1 text-xs font-semibold transition-colors border-b-2',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35',
                        side === 'buy'
                            ? 'border-up text-up bg-up-bg/50'
                            : 'border-transparent text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                >
                    买入
                </button>
                <button
                    onClick={() => setSide('sell')}
                    className={[
                        'flex-1 text-xs font-semibold transition-colors border-b-2',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-down/35',
                        side === 'sell'
                            ? 'border-down text-down bg-down-bg/50'
                            : 'border-transparent text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                >
                    卖出
                </button>
            </div>

            {/* Form Body - 流式布局 */}
            <div className="p-3 space-y-3">
                {/* 杠杆倍数选择器 */}
                <div className="space-y-1">
                    <label className="text-xs text-text-tertiary">杠杆倍数</label>
                    <LeverageSelector selected={leverage} onSelect={setLeverage} />
                </div>

                {/* Balance + Borrowable */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">可用</span>
                        <span className="text-text-primary font-mono font-medium">
                            {availableBalance}{' '}
                            <span className="text-text-tertiary">{balanceUnit}</span>
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">
                            可借 <span className="text-up text-[10px]">({leverage}x)</span>
                        </span>
                        <span className="text-up font-mono font-medium">
                            {borrowable}{' '}
                            <span className="text-text-tertiary">{borrowUnit}</span>
                        </span>
                    </div>
                </div>

                {/* Price Input */}
                <div className="space-y-1">
                    <label className="text-xs text-text-tertiary">价格</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full h-8 bg-bg-soft/80 text-text-primary px-3 text-xs rounded-sm border border-line-dark outline-none font-mono transition-colors hover:border-line-light focus:border-up focus-visible:ring-2 focus-visible:ring-up/35"
                            placeholder="0.00"
                        />
                        <span className="absolute right-3 top-2 text-xs text-text-tertiary pointer-events-none">USDT</span>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                    <label className="text-xs text-text-tertiary">数量</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full h-8 bg-bg-soft/80 text-text-primary px-3 text-xs rounded-sm border border-line-dark outline-none font-mono transition-colors hover:border-line-light focus:border-up focus-visible:ring-2 focus-visible:ring-up/35"
                            placeholder="0.00"
                        />
                        <span className="absolute right-3 top-2 text-xs text-text-tertiary pointer-events-none">BTC</span>
                    </div>
                </div>

                {/* Percentage Buttons */}
                <PercentageButtons selected={percentage} onSelect={setPercentage} />

                {/* Total Input */}
                <div className="space-y-1">
                    <label className="text-xs text-text-tertiary">金额</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={total}
                            onChange={(e) => setTotal(e.target.value)}
                            className="w-full h-8 bg-bg-soft/80 text-text-primary px-3 text-xs rounded-sm border border-line-dark outline-none font-mono transition-colors hover:border-line-light focus:border-up focus-visible:ring-2 focus-visible:ring-up/35"
                            placeholder="0.00"
                        />
                        <span className="absolute right-3 top-2 text-xs text-text-tertiary pointer-events-none">USDT</span>
                    </div>
                </div>

                {/* 借币提示 */}
                <div className="p-2 rounded-sm bg-up/5 border border-up/15">
                    <div className="flex items-center gap-1.5 text-xxs text-up">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 3v1.5h-1.5V4h1.5zm0 3v5h-1.5V7h1.5z" />
                        </svg>
                        <span>下单后将自动借入不足部分，日利率按市场利率计算</span>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="p-3 border-t border-line-dark bg-bg-panel">
                <button
                    className={[
                        'w-full h-9 rounded-sm text-sm font-bold text-white transition-colors active:opacity-90',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35',
                        side === 'buy'
                            ? 'bg-up hover:bg-up-light'
                            : 'bg-down hover:bg-down-light',
                    ].join(' ')}
                >
                    {side === 'buy' ? `杠杆买入 BTC` : `杠杆卖出 BTC`}
                </button>
            </div>
        </div>
    );
});
