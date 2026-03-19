import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  /** When true, skips the entrance animation (e.g. when opening a task sidebar so we don't show loader-style animation) */
  skipAnimation?: boolean;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: 'blur(4px)',
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
    filter: 'blur(4px)',
  },
};

const pageTransition = {
  duration: 0.4,
};

const contentVariants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.1,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const PageTransition = ({
  children,
  className = '',
  skipAnimation = false,
}: PageTransitionProps) => {
  return (
    <motion.div
      initial={skipAnimation ? 'in' : 'initial'}
      animate='in'
      exit='out'
      variants={pageVariants}
      transition={pageTransition}
      className={`h-full w-full ${className}`}
    >
      <motion.div
        initial={skipAnimation ? 'in' : 'initial'}
        animate='in'
        variants={contentVariants}
        className='h-full w-full flex flex-col gap-6'
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
