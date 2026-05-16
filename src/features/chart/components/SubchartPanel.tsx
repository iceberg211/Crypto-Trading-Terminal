/**
 * 副图面板组件
 * 
 * 渲染单个副图插槽
 */

import { useRef, useEffect, CSSProperties } from 'react';
import type { SubchartType } from '../hooks/useSubchartSlots';

interface SubchartPanelProps {
  slotId: string;
  type: SubchartType;
  onSetContainer: (slotId: string, container: HTMLDivElement | null) => void;
  onRemove: (slotId: string) => void;
  height?: string;
  className?: string;
  style?: CSSProperties;
}

export function SubchartPanel({
  slotId,
  type,
  onSetContainer,
  onRemove,
  height,
  className = '',
  style,
}: SubchartPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 当 type 存在且 container 准备好时注册
  useEffect(() => {
    // 只有当 type 有值时才注册
    if (!type) return;
    
    // 使用 requestAnimationFrame 确保 DOM 已渲染
    const rafId = requestAnimationFrame(() => {
      if (containerRef.current) {
        onSetContainer(slotId, containerRef.current);
      }
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      // 清理时注销
      onSetContainer(slotId, null);
    };
  }, [slotId, type, onSetContainer]);

  // 不显示空的副图
  if (!type) return null;

  return (
    <div className={`border-t border-line-dark flex flex-col min-h-0 ${className}`} style={style}>
      <div className="flex items-center justify-between px-3 py-1 bg-bg-panel/70">
        <span className="text-text-primary text-[11px] font-semibold tracking-wide">{type}</span>
        <button
          onClick={() => onRemove(slotId)}
          className="text-text-secondary hover:text-text-primary transition-colors text-[12px] font-semibold"
          aria-label={`关闭 ${type}`}
        >
          关闭
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-0"
        style={height ? { height } : undefined}
      />
    </div>
  );
}
