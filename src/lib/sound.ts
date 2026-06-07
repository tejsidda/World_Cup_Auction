'use client';

// Lightweight Web Audio sound cues — no audio files, synthesized on the fly.
// Respects a persisted mute flag so users can silence the auction.

const MUTE_KEY = 'wc26_muted_v1';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MUTE_KEY) === '1';
}

export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
}

type ToneStep = { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number };

function playSequence(steps: ToneStep[]): void {
  if (isMuted()) return;
  const audio = getCtx();
  if (!audio) return;

  const now = audio.currentTime;
  for (const step of steps) {
    const osc = audio.createOscillator();
    const gainNode = audio.createGain();
    osc.type = step.type ?? 'sine';
    osc.frequency.value = step.freq;

    const peak = step.gain ?? 0.12;
    const startAt = now + step.start;
    const endAt = startAt + step.duration;

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    osc.connect(gainNode);
    gainNode.connect(audio.destination);
    osc.start(startAt);
    osc.stop(endAt + 0.02);
  }
}

/** Bidding window opened — bright two-note rise. */
export function playOpen(): void {
  playSequence([
    { freq: 523, start: 0, duration: 0.12, type: 'triangle' },
    { freq: 784, start: 0.1, duration: 0.16, type: 'triangle' },
  ]);
}

/** Your bid registered — soft single blip. */
export function playBid(): void {
  playSequence([{ freq: 660, start: 0, duration: 0.09, type: 'sine', gain: 0.08 }]);
}

/** Sold — hammer: a confident descending three-note flourish. */
export function playSold(): void {
  playSequence([
    { freq: 784, start: 0, duration: 0.12, type: 'square', gain: 0.1 },
    { freq: 988, start: 0.11, duration: 0.12, type: 'square', gain: 0.1 },
    { freq: 1319, start: 0.22, duration: 0.22, type: 'triangle', gain: 0.12 },
  ]);
}

/** Unsold / passed — low muted thud. */
export function playUnsold(): void {
  playSequence([{ freq: 196, start: 0, duration: 0.28, type: 'sine', gain: 0.1 }]);
}
