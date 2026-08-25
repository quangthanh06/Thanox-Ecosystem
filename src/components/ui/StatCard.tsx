import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  comparison?: string;
  accentColor?: 'brand' | 'accent' | 'success' | 'warning' | 'info' | 'danger';
  sparklineData?: number[];
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  accentColor = 'brand',
  sparklineData,
  onClick,
}) => {
  const iconColors = {
    brand: 'bg-[#7C3AED]/15 text-[#C084FC] border-[#7C3AED]/30 shadow-[0_0_12px_rgba(124,58,237,0.2)]',
    accent: 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    info: 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
    danger: 'bg-red-500/15 text-red-300 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
  };

  // Generate SVG path for mini sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const max = Math.max(...sparklineData, 1);
    const min = Math.min(...sparklineData, 0);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80">
        <path
          d={pathD}
          fill="none"
          stroke={trend?.isPositive !== false ? '#34D399' : '#F87171'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <Card
      variant={onClick ? 'interactive' : 'default'}
      padding="md"
      className="relative overflow-hidden group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[11.5px] font-bold text-[#938EB5] uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${iconColors[accentColor]}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-2.5">
        <div className="font-display text-2xl sm:text-[28px] font-black text-[#F4F2FF] tracking-tight leading-none tabular-nums">
          {value}
        </div>
        {renderSparkline()}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {trend && (
          <div
            className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-xl text-[11px] backdrop-blur-md border ${
              trend.isPositive === true
                ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25'
                : trend.isPositive === false
                ? 'bg-red-500/12 text-red-300 border-red-500/25'
                : 'bg-white/6 text-[#938EB5] border-white/10'
            }`}
          >
            {trend.value}
          </div>
        )}
      </div>
    </Card>
  );
};
