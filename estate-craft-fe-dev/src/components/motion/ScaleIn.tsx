import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScaleInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  scale?: number;
}

export const ScaleIn = ({
  children,
  duration = 0.5,
  delay = 0,
  className = '',
  scale = 0.8,
}: ScaleInProps) => {
  return (
    <motion.div
      initial={{ scale, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale, opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.175, 0.885, 0.32, 1.275], // Custom bounce effect
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
