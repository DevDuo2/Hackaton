import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${
        hover
          ? 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 pb-4 border-b border-slate-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);
