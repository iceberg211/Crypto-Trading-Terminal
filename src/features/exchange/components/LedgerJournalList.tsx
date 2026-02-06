import { memo } from 'react';
import dayjs from 'dayjs';
import type { LedgerJournal } from '@/domain/exchange';

const kindLabel: Record<LedgerJournal['kind'], string> = {
  LOCK: '冻结',
  UNLOCK: '解冻',
  TRADE_SETTLE: '成交清算',
  FEE: '手续费',
};

export const LedgerJournalList = memo(function LedgerJournalList({ journals }: { journals: LedgerJournal[] }) {
  if (journals.length === 0) {
    return <div className="p-4 text-xs text-text-tertiary">暂无账务分录记录</div>;
  }

  return (
    <div className="h-full overflow-auto px-3 py-2 space-y-2">
      {journals.map((journal) => (
        <div key={journal.journalId} className="rounded border border-line-dark bg-bg-soft/50 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-text-primary">{kindLabel[journal.kind]}</span>
            <span className="font-mono text-[10px] text-text-tertiary">
              {dayjs(journal.timestamp).format('MM-DD HH:mm:ss')}
            </span>
          </div>

          <div className="mt-2 space-y-1">
            {journal.lines.map((line) => (
              <div key={line.lineId} className="grid grid-cols-[70px_1fr_88px] items-center gap-2 rounded bg-bg-panel px-2 py-1 text-[10px]">
                <span className="font-mono text-text-tertiary">{line.asset}</span>
                <span className="text-text-secondary">{line.account}</span>
                <span className={`font-mono text-right ${line.delta.startsWith('-') ? 'text-down' : 'text-up'}`}>
                  {line.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
