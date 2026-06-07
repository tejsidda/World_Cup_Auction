'use client';

import { useEffect, useState } from 'react';
import { squadFlagUrl } from '@/lib/fifa/assets';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-5 w-7',
  md: 'h-7 w-10',
  lg: 'h-10 w-14',
  xl: 'h-16 w-[4.5rem]',
} as const;

type SquadFlagSize = keyof typeof sizeClasses;

interface SquadFlagProps {
  abbr: string;
  size?: SquadFlagSize;
  className?: string;
  title?: string;
}

export function SquadFlag({ abbr, size = 'md', className, title }: SquadFlagProps) {
  const [failed, setFailed] = useState(false);
  const code = abbr?.trim().toUpperCase();
  const valid = Boolean(code && code !== '—');

  useEffect(() => {
    setFailed(false);
  }, [code]);

  if (!valid || failed) {
    return (
      <span
        title={title ?? code}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded font-mono font-bold uppercase',
          'bg-white/10 text-white/70 border border-white/10',
          size === 'sm' && 'text-[9px]',
          size === 'md' && 'text-[10px]',
          size === 'lg' && 'text-[11px]',
          size === 'xl' && 'text-[12px]',
          sizeClasses[size],
          className
        )}
      >
        {valid ? code : '?'}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlinked FIFA CDN with onError fallback
    <img
      src={squadFlagUrl(code)}
      alt=""
      title={title ?? code}
      onError={() => setFailed(true)}
      className={cn('inline-block shrink-0 object-contain', sizeClasses[size], className)}
    />
  );
}
