'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <motion.span
      key={displayValue}
      initial={{ opacity: 0.5, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-block"
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
}
