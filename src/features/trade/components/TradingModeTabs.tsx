import { useAtom } from 'jotai';
import { tradingModeAtom, type TradingMode } from '../atoms/tradingModeAtom';

const MODES: { value: TradingMode; label: string }[] = [
    { value: 'spot', label: '现货' },
    { value: 'margin', label: '杠杆' },
    { value: 'futures', label: '合约' },
];

/**
 * 交易模式 Tab 切换器
 * 放置在右栏顶部，控制交易表单区域显示哪种模式
 */
export function TradingModeTabs() {
    const [mode, setMode] = useAtom(tradingModeAtom);

    return (
        <div className="flex items-center h-8 border-b border-line-dark bg-bg-panel px-1">
            {MODES.map((m) => {
                const active = m.value === mode;
                return (
                    <button
                        key={m.value}
                        type="button"
                        onClick={() => setMode(m.value)}
                        className={[
                            'relative h-7 px-4 text-xs font-medium rounded-sm transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/35',
                            active
                                ? 'text-up'
                                : 'text-text-secondary hover:text-text-primary',
                        ].join(' ')}
                    >
                        {m.label}
                        {/* 底部高亮指示器 */}
                        {active && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-up rounded-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
