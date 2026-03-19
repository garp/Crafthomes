import React from 'react';
import { BoxJumpLoader } from './BoxJumpLoader';
import type { ButtonLoaderProps } from '../../../types/loader';

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({ text }) => {
  return (
    <span className='inline-flex items-center gap-2'>
      <BoxJumpLoader size='sm' />
      {text ? <span className='text-sm font-medium'>{text}</span> : null}
    </span>
  );
};
