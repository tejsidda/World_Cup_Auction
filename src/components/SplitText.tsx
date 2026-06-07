'use client';

import { motion } from 'motion/react';

export function SplitText({
  text,
  delay = 0,
  className = "",
  stagger = 0.02
}: {
  text: string;
  delay?: number;
  className?: string;
  stagger?: number;
}) {
  return (
    <span className={`inline-block ${className}`}>
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          initial={{ y: '100%', rotate: 4, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1.08, 0.38, 0.98], // Custom cubic bezier matching premium UI aesthetics
            delay: delay + index * stagger,
          }}
          className="inline-block whitespace-pre will-change-transform"
          style={char !== ' ' ? { marginRight: '-0.045em' } : undefined}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
