import { useState, memo } from 'react';
import { BORROW_RATES } from '../data/marginMockData';

const ASSETS = ['USDT', 'BTC', 'ETH'] as const;

/**
 * 借币面板（Mock）
 * 展示借入资产选择、金额输入、利率预览
 */
export const BorrowPanel = memo(function BorrowPanel() {
    const [asset, setAsset] = useState<string>('USDT');
    const [amount, setAmount] = useState('');

    const rate = BORROW_RATES[asset] || '0.00';
    const dailyRate = (parseFloat(rate) / 365).toFixed(4);
    const estimatedInterest = amount
        ? (parseFloat(amount) * parseFloat(dailyRate) / 100).toFixed(6)
        : '--';

    return (
        <div className="p-3 space-y-3 bg-bg-card border-t border-line-dark">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-primary">借币</span>
                <span className="text-xxs text-text-tertiary">手动借币</span>
            </div>

            {/* 资产选择 */}
            <div className="space-y-1">
                <label className="text-xs text-text-tertiary">借入资产</label>
                <div className="flex gap-1 p-0.5 bg-bg-panel border border-line-dark rounded-sm">
                    {ASSETS.map((a) => (
                        <button
                            key={a}
                            type="button"
                            onClick={() => setAsset(a)}
                            className={[
                                'flex-1 h-6 text-xs rounded-sm transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35',
                                asset === a
                                    ? 'bg-bg-card text-text-primary font-medium'
                                    : 'text-text-secondary hover:text-text-primary',
                            ].join(' ')}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            </div>

            {/* 数量输入 */}
            <div className="space-y-1">
                <label className="text-xs text-text-tertiary">借入数量</label>
                <div className="relative group">
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full h-8 bg-bg-soft/80 text-text-primary px-3 text-xs rounded-sm border border-line-dark outline-none font-mono transition-colors hover:border-line-light focus:border-up focus-visible:ring-2 focus-visible:ring-up/35"
                        placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-xs text-text-tertiary pointer-events-none">
                        {asset}
                    </span>
                </div>
            </div>

            {/* 利率信息 */}
            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                    <span className="text-text-secondary">年化利率</span>
                    <span className="text-text-primary font-mono">{rate}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">日利率</span>
                    <span className="text-text-primary font-mono">{dailyRate}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">预估日利息</span>
                    <span className="text-up font-mono">
                        {estimatedInterest} {asset}
                    </span>
                </div>
            </div>

            {/* 借入按钮 */}
            <button
                type="button"
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full h-8 rounded-sm text-xs font-medium text-white bg-up hover:bg-up-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35"
            >
                确认借入
            </button>
        </div>
    );
});
