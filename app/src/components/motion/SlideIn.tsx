import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  className?: string;
}

export const SlideIn = ({
  children,
  direction = 'left',
  duration = 0.5,
  delay = 0,
  className = '',
}: SlideInProps) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -50, opacity: 0 };
      case 'right':
        return { x: 50, opacity: 0 };
      case 'up':
        return { y: 50, opacity: 0 };
      case 'down':
        return { y: -50, opacity: 0 };
      default:
        return { x: -50, opacity: 0 };
    }
  };

  const getFinalPosition = () => {
    switch (direction) {
      case 'left':
      case 'right':
        return { x: 0, opacity: 1 };
      case 'up':
      case 'down':
        return { y: 0, opacity: 1 };
      default:
        return { x: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getFinalPosition()}
      exit={getInitialPosition()}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
