import React from 'react';
import '../../../styles/loader.css';
import type { BoxJumpLoaderProps } from '../../../types/loader';

const sizeToScale: Record<NonNullable<BoxJumpLoaderProps['size']>, number> = {
  sm: 0.6,
  md: 1,
  lg: 1.4,
};

export const BoxJumpLoader: React.FC<BoxJumpLoaderProps> = ({
  className = '',
  text,
  size = 'md',
}) => {
  const scale = sizeToScale[size] ?? 1;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className='box-jump-loader' style={{ transform: `scale(${scale})` }} />
      {text && <p className='mt-6 text-gray-700 font-poppins text-lg font-medium'>{text}</p>}
    </div>
  );
};

export default BoxJumpLoader;
