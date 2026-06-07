'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, setMuted } from '@/lib/sound';

export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Unmute auction sounds' : 'Mute auction sounds'}
      title={muted ? 'Sounds off' : 'Sounds on'}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-sm border border-white/[0.1] bg-white/[0.04] text-white/50 hover:text-white hover:border-white/[0.2] transition-colors ${className}`}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}
