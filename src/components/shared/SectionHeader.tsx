import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  accent?: 'green' | 'gold' | 'neutral';
}

const accentBar: Record<NonNullable<SectionHeaderProps['accent']>, string> = {
  green: 'bg-[#00A94F]',
  gold: 'bg-[#E5A93D]',
  neutral: 'bg-white/30',
};

export function SectionHeader({ title, icon, accent = 'green' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between fifa-section-rule pb-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-[3px] h-4 shrink-0 rounded-full ${accentBar[accent]}`} aria-hidden="true" />
        <h3 className="fifa-section-title truncate">{title}</h3>
      </div>
      {icon && <span className="shrink-0 text-white/40">{icon}</span>}
    </div>
  );
}
