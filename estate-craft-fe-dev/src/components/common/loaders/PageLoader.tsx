import React from 'react';
import { motion } from 'framer-motion';
import { BoxJumpLoader } from './BoxJumpLoader';
import type { PageLoaderProps } from '../../../types/loader';

export const PageLoader: React.FC<PageLoaderProps> = ({ text = 'Loading your content...' }) => {
  return (
    <motion.div
      className='fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <BoxJumpLoader text={text} size='lg' />
    </motion.div>
  );
};
