import React, { useState } from 'react';
import { CurrencyCode } from '../types/business';
import { formatCompactMoney, formatMoney } from '../utils/formatters';

export interface ChartBucket {
  label: string;
  fullLabel: string;
  income: number;
  expense: number;
}

interface CashflowChartProps {
  buckets: ChartBucket[];
  currency: CurrencyCode;
  height?: number;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({
  buckets,
  currency,
  height = 240,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (buckets.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-[var(--text-muted)]">
        Нет финансовых операций за выбранный период
      </div>
    );
  }

  const maxVal = Math.max(
    1,
    ...buckets.map((b) => Math.max(b.income, b.expense))
  );

  // Clean SVG coordinate system
  const svgWidth = 720;
  const svgHeight = height;
  const padLeft = 64;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 32;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const groupWidth = plotW / buckets.length;
  const barWidth = Math.min(22, Math.max(6, groupWidth * 0.28));
  const gapBetweenBars = Math.min(6, Math.max(2, groupWidth * 0.08));

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const activeBucket = hoveredIndex !== null ? buckets[hoveredIndex] : null;

  return (
    <div className="relative select-none">
      {/* Legend & hover summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 min-h-[24px]">
        <div className="flex items-center gap-5 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            Доходы
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            Расходы
          </span>
        </div>

        {activeBucket ? (
          <div className="flex items-center gap-3 text-xs font-mono-num text-[var(--text-primary)]">
            <span className="text-[var(--text-muted)] font-sans">{activeBucket.fullLabel}</span>
            <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
            <span className="text-emerald-500">+{formatMoney(activeBucket.income, currency)}</span>
            <span className="text-rose-500">−{formatMoney(activeBucket.expense, currency)}</span>
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">
            Наведите на столбец для детализации
          </span>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="График доходов и расходов"
        >
          {/* Horizontal grid lines */}
          {ticks.map((t) => {
            const y = padTop + plotH * (1 - t);
            const tickValue = maxVal * t;
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-500/15"
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] text-[10px] font-mono-num"
                >
                  {t === 0 ? '0' : formatCompactMoney(tickValue, currency)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {buckets.map((bucket, idx) => {
            const centerX = padLeft + groupWidth * idx + groupWidth / 2;
            const incH = Math.max(bucket.income > 0 ? 3 : 0, (bucket.income / maxVal) * plotH);
            const expH = Math.max(bucket.expense > 0 ? 3 : 0, (bucket.expense / maxVal) * plotH);
            const incX = centerX - barWidth - gapBetweenBars / 2;
            const expX = centerX + gapBetweenBars / 2;
            const baseY = padTop + plotH;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={bucket.fullLabel + idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(idx === hoveredIndex ? null : idx)}
                className="cursor-pointer"
              >
                {/* Invisible hit zone */}
                <rect
                  x={padLeft + groupWidth * idx}
                  y={padTop}
                  width={groupWidth}
                  height={plotH + padBottom}
                  fill={isHovered ? 'rgba(148, 163, 184, 0.06)' : 'transparent'}
                  rx={4}
                />

                {/* Income bar */}
                <rect
                  x={incX}
                  y={baseY - incH}
                  width={barWidth}
                  height={incH}
                  rx={3}
                  className={`transition-opacity duration-150 ${
                    hoveredIndex !== null && !isHovered ? 'opacity-45' : 'opacity-100'
                  }`}
                  fill="#10b981"
                />

                {/* Expense bar */}
                <rect
                  x={expX}
                  y={baseY - expH}
                  width={barWidth}
                  height={expH}
                  rx={3}
                  className={`transition-opacity duration-150 ${
                    hoveredIndex !== null && !isHovered ? 'opacity-45' : 'opacity-100'
                  }`}
                  fill="#f43f5e"
                />

                {/* X-axis label */}
                <text
                  x={centerX}
                  y={baseY + 18}
                  textAnchor="middle"
                  className={`text-[10.5px] font-mono-num ${
                    isHovered ? 'fill-[var(--text-primary)] font-semibold' : 'fill-[var(--text-muted)]'
                  }`}
                >
                  {bucket.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
