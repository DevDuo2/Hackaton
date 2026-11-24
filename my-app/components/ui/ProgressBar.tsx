import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  color?: 'blue' | 'purple' | 'green' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'blue',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colorClasses = {
    blue: 'bg-[#2563EB]',
    purple: 'bg-[#8B5CF6]',
    green: 'bg-[#16A34A]',
    amber: 'bg-[#F59E0B]',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs text-[#64748B]">
          <span>Progress</span>
          <span className="font-semibold text-[#1E293B]">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
