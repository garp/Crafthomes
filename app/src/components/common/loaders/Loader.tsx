import React from 'react';
import { BoxJumpLoader } from './BoxJumpLoader';
import { ButtonLoader } from './ButtonLoader';
import { ComponentLoader } from './ComponentLoader';
import { PageLoader } from './PageLoader';
import type { LoaderProps } from '../../../types/loader';

export const Loader: React.FC<LoaderProps> = ({
  variant = 'box',
  text,
  size = 'md',
  minHeight,
}) => {
  switch (variant) {
    case 'page':
      return <PageLoader text={text} />;
    case 'button':
      return <ButtonLoader text={text} />;
    case 'component':
      return <ComponentLoader text={text} minHeight={minHeight} />;
    case 'box':
    default:
      return (
        <div className='w-full h-full flex items-center justify-center'>
          <BoxJumpLoader text={text} size={size} />
        </div>
      );
  }
};

export default Loader;
