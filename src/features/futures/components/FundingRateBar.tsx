import { useState, useEffect, memo } from 'react';
import { getMockFundingInfo } from '../data/futuresMockData';

function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return [hours, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * 资金费率信息条（双行紧凑布局，适应 320px 窄列）
 */
export const FundingRateBar = memo(function FundingRateBar() {
    const [info] = useState(() => getMockFundingInfo());
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        const tick = () => {
            const remaining = info.nextFundingTime - Date.now();
            setCountdown(formatCountdown(remaining));
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [info.nextFundingTime]);

    const rateNum = parseFloat(info.rate);
    const rateColor = rateNum > 0 ? 'text-up' : rateNum < 0 ? 'text-down' : 'text-text-primary';

    return (
        <div className="shrink-0 px-3 py-1.5 bg-bg-panel border-b border-line-dark">
            {/* 第一行: 费率 + 倒计时 */}
            <div className="flex items-center justify-between text-[11px] mb-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-text-tertiary">资金费率</span>
                    <span className={`font-mono font-medium ${rateColor}`}>
                        {info.rate}%
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-text-tertiary">倒计时</span>
                    <span className="font-mono text-up">{countdown}</span>
                </div>
            </div>
            {/* 第二行: 标记价 + 指数价 */}
            <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                    <span className="text-text-tertiary">标记价</span>
                    <span className="font-mono text-text-primary">{info.markPrice}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-text-tertiary">指数价</span>
                    <span className="font-mono text-text-secondary">{info.indexPrice}</span>
                </div>
            </div>
        </div>
    );
});
