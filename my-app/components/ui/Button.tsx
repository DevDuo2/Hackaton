import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 shadow-sm',
  };

  const variantClasses = {
    primary:
      'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-500/20 shadow-md hover:shadow-lg',
    secondary:
      'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-purple-500/20 shadow-md hover:shadow-lg',
    outline:
      'bg-white hover:bg-slate-50 text-[#1E293B] border border-slate-200 hover:border-slate-300',
    ghost:
      'bg-transparent hover:bg-slate-100 text-[#64748B] hover:text-[#1E293B]',
    success:
      'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-green-500/20 shadow-md',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
