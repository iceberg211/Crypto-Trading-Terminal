import { useState, memo, useCallback } from 'react';
import {
    LEVERAGE_MARKS,
    DEFAULT_FUTURES_LEVERAGE,
    type PositionSide,
    type MarginType,
} from '../data/futuresMockData';

// 杠杆滑块组件
function LeverageSlider({
    value,
    onChange,
}: {
    value: number;
    onChange: (v: number) => void;
}) {
    const handleInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = parseInt(e.target.value, 10);
            const closest = LEVERAGE_MARKS.reduce((prev, curr) =>
                Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
            );
            onChange(closest);
        },
        [onChange]
    );

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-xs text-text-tertiary">杠杆</label>
                <span className="text-xs font-mono font-medium text-up">{value}x</span>
            </div>
            <input
                type="range"
                min={1}
                max={125}
                value={value}
                onChange={handleInput}
                className="w-full h-1 bg-bg-soft rounded-full appearance-none cursor-pointer accent-up [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-up [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg-card [&::-webkit-slider-thumb]:shadow-sm"
            />
            <div className="flex justify-between">
                {LEVERAGE_MARKS.filter((_, i) => i % 2 === 0).map((mark) => (
                    <button
                        key={mark}
                        type="button"
                        onClick={() => onChange(mark)}
                        className={[
                            'text-[10px] px-1 rounded transition-colors',
                            value === mark
                                ? 'text-up font-medium'
                                : 'text-text-tertiary hover:text-text-secondary',
                        ].join(' ')}
                    >
                        {mark}x
                    </button>
                ))}
            </div>
        </div>
    );
}

// 全仓/逐仓切换
function MarginTypeToggle({
    value,
    onChange,
}: {
    value: MarginType;
    onChange: (v: MarginType) => void;
}) {
    return (
        <div className="flex gap-1 p-0.5 bg-bg-panel border border-line-dark rounded-sm">
            {(['cross', 'isolated'] as MarginType[]).map((type) => (
                <button
                    key={type}
                    type="button"
                    onClick={() => onChange(type)}
                    className={[
                        'flex-1 h-6 text-xs rounded-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35',
                        value === type
                            ? 'bg-bg-card text-text-primary font-medium'
                            : 'text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                >
                    {type === 'cross' ? '全仓' : '逐仓'}
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
 * 合约交易表单
 * 流式布局（不使用 flex h-full），确保在滚动容器中正常展示所有内容
 */
export const FuturesTradeForm = memo(function FuturesTradeForm() {
    const [direction, setDirection] = useState<PositionSide>('long');
    const [marginType, setMarginType] = useState<MarginType>('cross');
    const [leverage, setLeverage] = useState(DEFAULT_FUTURES_LEVERAGE);
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [stopProfit, setStopProfit] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [percentage, setPercentage] = useState(0);

    const isLong = direction === 'long';

    return (
        <div className="bg-bg-card">
            {/* 开多/开空切换 */}
            <div className="flex border-b border-line-dark bg-bg-panel h-8">
                <button
                    onClick={() => setDirection('long')}
                    className={[
                        'flex-1 text-xs font-semibold transition-colors border-b-2',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35',
                        isLong
                            ? 'border-up text-up bg-up-bg/50'
                            : 'border-transparent text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                >
                    开多
                </button>
                <button
                    onClick={() => setDirection('short')}
                    className={[
                        'flex-1 text-xs font-semibold transition-colors border-b-2',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35',
                        !isLong
                            ? 'border-down text-down bg-down-bg/50'
                            : 'border-transparent text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                >
                    开空
                </button>
            </div>

            {/* Form Body - 流式布局 */}
            <div className="p-3 space-y-3">
                {/* 全仓/逐仓 */}
                <MarginTypeToggle value={marginType} onChange={setMarginType} />

                {/* 杠杆滑块 */}
                <LeverageSlider value={leverage} onChange={setLeverage} />

                {/* 可用余额 */}
                <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">可用保证金</span>
                    <span className="text-text-primary font-mono font-medium">
                        10,000.00 <span className="text-text-tertiary">USDT</span>
                    </span>
                </div>

                {/* 价格输入 */}
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

                {/* 数量输入 */}
                <div className="space-y-1">
                    <label className="text-xs text-text-tertiary">数量 (张)</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full h-8 bg-bg-soft/80 text-text-primary px-3 text-xs rounded-sm border border-line-dark outline-none font-mono transition-colors hover:border-line-light focus:border-up focus-visible:ring-2 focus-visible:ring-up/35"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-2 text-xs text-text-tertiary pointer-events-none">BTC</span>
                    </div>
                </div>

                {/* Percentage Buttons */}
                <PercentageButtons selected={percentage} onSelect={setPercentage} />

                {/* 止盈止损 */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-xxs text-text-tertiary">止盈</label>
                        <input
                            type="text"
                            value={stopProfit}
                            onChange={(e) => setStopProfit(e.target.value)}
                            className="w-full h-7 bg-bg-soft/80 text-text-primary px-2 text-xs rounded-sm border border-line-dark outline-none font-mono transition-colors hover:border-line-light focus:border-up/50 focus-visible:ring-2 focus-visible:ring-up/25"
                            placeholder="--"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xxs text-text-tertiary">止损</label>
                        <input
                            type="text"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            className="w-full h-7 bg-bg-soft/80 text-text-primary px-2 text-xs rounded-sm border border-line-dark outline-none font-mono transition-colors hover:border-line-light focus:border-down/50 focus-visible:ring-2 focus-visible:ring-down/25"
                            placeholder="--"
                        />
                    </div>
                </div>

                {/* 下单信息摘要 */}
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-text-secondary">预估保证金</span>
                        <span className="text-text-primary font-mono">
                            {price && amount
                                ? (parseFloat(price) * parseFloat(amount) / leverage).toFixed(2)
                                : '--'}{' '}
                            USDT
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">手续费</span>
                        <span className="text-text-tertiary font-mono">0.04%</span>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="p-3 border-t border-line-dark bg-bg-panel">
                <button
                    className={[
                        'w-full h-9 rounded-sm text-sm font-bold text-white transition-colors active:opacity-90',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35',
                        isLong
                            ? 'bg-up hover:bg-up-light'
                            : 'bg-down hover:bg-down-light',
                    ].join(' ')}
                >
                    {isLong ? `开多 BTC ${leverage}x` : `开空 BTC ${leverage}x`}
                </button>
            </div>
        </div>
    );
});
