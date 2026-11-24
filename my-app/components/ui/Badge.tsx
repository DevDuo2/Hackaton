import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'green' | 'amber' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  className = '',
}) => {
  const variants = {
    blue: 'bg-blue-50 text-[#2563EB] border border-blue-100',
    purple: 'bg-purple-50 text-[#8B5CF6] border border-purple-100',
    green: 'bg-emerald-50 text-[#16A34A] border border-emerald-100',
    amber: 'bg-amber-50 text-[#F59E0B] border border-amber-100',
    slate: 'bg-slate-100 text-[#64748B] border border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
