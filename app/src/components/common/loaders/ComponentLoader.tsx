import React from 'react';
import { BoxJumpLoader } from './BoxJumpLoader';
import type { ComponentLoaderProps } from '../../../types/loader';

export const ComponentLoader: React.FC<ComponentLoaderProps> = ({
  text = 'Loading...',
  minHeight = 160,
}) => {
  return (
    <div className='flex items-center justify-center' style={{ minHeight }}>
      <BoxJumpLoader text={text} />
    </div>
  );
};
