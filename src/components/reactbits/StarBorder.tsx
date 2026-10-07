import React from 'react';

interface StarBorderProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'button' | 'a' | 'div';
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

export function StarBorder({
  as = 'button',
  className = '',
  color = '#a9484c',
  speed = '4s',
  children,
  ...props
}: StarBorderProps) {
  const Component = as as any;

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-2xl p-[1px] focus:outline-none ${className}`}
      {...props}
    >
      <div
        className="absolute inset-[-100%] animate-star-border"
        style={{
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${color} 360deg)`,
          animationDuration: speed,
        }}
      />
      <div className="relative rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 flex items-center justify-center gap-2 h-full w-full">
        {children}
      </div>
    </Component>
  );
}
