'use client';

import { useEffect, useState } from 'react';
import { squadJerseyUrl } from '@/lib/fifa/assets';
import { cn } from '@/lib/utils';
import { SquadFlag } from './SquadFlag';

const sizeClasses = {
  sm: 'h-9 w-7',
  md: 'h-12 w-9',
  lg: 'h-16 w-12',
} as const;

type SquadJerseySize = keyof typeof sizeClasses;

interface SquadJerseyProps {
  squadId?: number | null;
  /** Used when jersey fails to load or squad id is missing */
  countryAbbr?: string;
  size?: SquadJerseySize;
  className?: string;
  title?: string;
}

export function SquadJersey({
  squadId,
  countryAbbr,
  size = 'md',
  className,
  title,
}: SquadJerseyProps) {
  const [failed, setFailed] = useState(false);
  const validId = typeof squadId === 'number' && squadId > 0;

  useEffect(() => {
    setFailed(false);
  }, [squadId]);

  if (!validId || failed) {
    if (countryAbbr) {
      return <SquadFlag abbr={countryAbbr} size={size === 'lg' ? 'lg' : 'md'} className={className} title={title} />;
    }
    return (
      <span
        title={title}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded bg-white/10 text-white/50 border border-white/10 text-[10px] font-mono',
          sizeClasses[size],
          className
        )}
      >
        ?
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlinked FIFA CDN with onError fallback
    <img
      src={squadJerseyUrl(squadId)}
      alt=""
      title={title ?? countryAbbr}
      onError={() => setFailed(true)}
      className={cn('inline-block shrink-0 object-contain', sizeClasses[size], className)}
    />
  );
}
