import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface BounceProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  height?: number;
}

export const Bounce = ({
  children,
  duration = 0.5,
  delay = 0,
  className = '',
  height = 20,
}: BounceProps) => {
  return (
    <motion.div
      initial={{ y: height, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: height, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 10,
        duration,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
