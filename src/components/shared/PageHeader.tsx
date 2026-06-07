'use client';

import type { ReactNode } from 'react';
import { SplitText } from '../SplitText';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  icon?: ReactNode;
  meta?: ReactNode;
  right?: ReactNode;
  animateTitle?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  kicker = 'WC26 Fantasy',
  icon,
  meta,
  right,
  animateTitle = true,
}: PageHeaderProps) {
  return (
    <header className="mb-6 pb-0 flex flex-col gap-0 relative z-10">
      <div className="flex items-end justify-between gap-4 pb-6">
        <div className="flex items-start gap-4 min-w-0">
          {icon && (
            <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-sm bg-[#00A94F]/10 border border-[#00A94F]/25 text-[#00A94F] mt-1">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {kicker && <p className="fifa-kicker mb-2">{kicker}</p>}
            <h2 className="fifa-headline text-[34px] md:text-[52px] text-white overflow-hidden">
              {animateTitle ? <SplitText text={title} /> : title}
            </h2>
            {subtitle && <p className="fifa-subtitle">{subtitle}</p>}
            {meta}
          </div>
        </div>
        {right}
      </div>
      <div className="fifa-page-rule" aria-hidden="true" />
    </header>
  );
}
