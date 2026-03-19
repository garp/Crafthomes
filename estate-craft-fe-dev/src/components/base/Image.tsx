import React, { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { cn } from '../../utils/helper';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showLoader?: boolean;
  errorComponent?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  loaderWrapperClassName?: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  fallbackSrc,
  loading = 'lazy',
  objectFit = 'cover',
  rounded = 'none',
  showLoader = true,
  errorComponent,
  className = '',
  onLoad,
  onError,
  loaderWrapperClassName,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setHasError(true);
    onError?.();
  };

  const baseClasses = [
    objectFitClasses[objectFit],
    roundedClasses[rounded],
    'transition-opacity duration-300',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (hasError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${roundedClasses[rounded]} ${className}`}
      >
        <svg
          className='w-8 h-8 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      </div>
    );
  }

  return (
    <div className='relative'>
      {isLoading && showLoader && (
        <div
          className={cn(
            `absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center`,
            roundedClasses[rounded],
            loaderWrapperClassName,
          )}
        >
          <div className='w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin'></div>
        </div>
      )}

      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        className={`${baseClasses} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};
