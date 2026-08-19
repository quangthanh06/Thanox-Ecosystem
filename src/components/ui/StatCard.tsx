import React from 'react';
import { Card } from './Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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
  comparison = 'so với tháng trước',
  accentColor = 'brand',
  sparklineData,
  onClick,
}) => {
  const iconColors = {
    brand: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/25',
    accent: 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/25',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    danger: 'bg-red-500/15 text-red-400 border-red-500/25',
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
      <svg width={width} height={height} className="overflow-visible shrink-0 opacity-70">
        <path
          d={pathD}
          fill="none"
          stroke={trend?.isPositive !== false ? '#10B981' : '#EF4444'}
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
        <span className="text-[11.5px] font-bold text-[#6B658E] uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${iconColors[accentColor]}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="font-display text-2xl sm:text-[26px] font-bold text-[#F0EDFF] tracking-tight leading-none">
          {value}
        </div>
        {renderSparkline()}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {trend ? (
          <div
            className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md text-[11px] ${
              trend.isPositive === true
                ? 'bg-emerald-500/10 text-emerald-400'
                : trend.isPositive === false
                ? 'bg-red-500/10 text-red-400'
                : 'bg-white/5 text-[#8B84A8]'
            }`}
          >
            {trend.isPositive === true && <ArrowUpRight className="w-3 h-3" />}
            {trend.isPositive === false && <ArrowDownRight className="w-3 h-3" />}
            {trend.isPositive === undefined && <Minus className="w-3 h-3" />}
            <span>{trend.value}</span>
          </div>
        ) : null}
        <span className="text-[#555074] text-[11.5px] truncate">{trend?.label || comparison}</span>
      </div>
    </Card>
  );
};
