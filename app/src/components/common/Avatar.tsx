import React from 'react';
import { Tooltip } from '@mantine/core';
import { motion } from 'framer-motion';

export interface AvatarProps {
  name: string;
  phone?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  tooltipTitle?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  phone,
  email,
  size = 'md',
  showTooltip = true,
  tooltipTitle = '',
  bgColor = 'bg-green-500',
  textColor = 'text-white',
  onClick,
  className = '',
}) => {
  // Get first letter of the name
  const getInitial = (name: string) => {
    if (!name) return '';
    const splitted = name.split(' ');
    return splitted[0].charAt(0).toUpperCase() + (splitted[1]?.charAt(0)?.toLowerCase() || '');
  };

  // Size configurations
  const sizeConfig = {
    xs: {
      container: 'w-6 h-6 text-xs',
      font: 'text-xs',
    },
    sm: {
      container: 'w-8 h-8 text-sm',
      font: 'text-sm',
    },
    md: {
      container: 'w-10 h-10 text-base',
      font: 'text-base',
    },
    lg: {
      container: 'w-12 h-12 text-lg',
      font: 'text-lg',
    },
    xl: {
      container: 'w-16 h-16 text-xl',
      font: 'text-xl',
    },
  };

  // Get hover color based on background color
  const getHoverColor = (bgColor: string) => {
    const colorMap: Record<string, string> = {
      'bg-green-500': 'hover:bg-green-600',
      'bg-blue-500': 'hover:bg-blue-600',
      'bg-purple-500': 'hover:bg-purple-600',
      'bg-red-500': 'hover:bg-red-600',
      'bg-yellow-500': 'hover:bg-yellow-600',
      'bg-indigo-500': 'hover:bg-indigo-600',
      'bg-pink-500': 'hover:bg-pink-600',
      'bg-orange-500': 'hover:bg-orange-600',
      'bg-teal-500': 'hover:bg-teal-600',
      'bg-cyan-500': 'hover:bg-cyan-600',
    };
    return colorMap[bgColor] || 'hover:bg-gray-600';
  };

  const avatarElement = (
    <motion.div
      className={`
        ${sizeConfig[size].container}
        ${bgColor}
        ${textColor}
        ${getHoverColor(bgColor)}
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-medium
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        transition-all
        duration-200
        hover:scale-105
        shadow-sm
        hover:shadow-md
        shrink-0
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <span className={sizeConfig[size].font}>{getInitial(name)}</span>
    </motion.div>
  );

  // If no contact details or tooltip disabled, return just the avatar
  if (!showTooltip && !phone && !email) {
    return avatarElement;
  }

  // Tooltip content
  const tooltipContent = (
    <div className='p-3 bg-gray-800 text-white rounded-lg shadow-lg min-w-[200px]'>
      {(tooltipTitle || name) && (
        <div className='text-sm font-medium text-gray-200 mb-2'>{tooltipTitle || name}</div>
      )}
      <div className='space-y-1'>
        {phone && (
          <div className='flex items-center space-x-2 text-sm'>
            <svg
              className='w-4 h-4 text-gray-300'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
              />
            </svg>
            <span className='text-gray-100'>{phone}</span>
          </div>
        )}
        {email && (
          <div className='flex items-center space-x-2 text-sm'>
            <svg
              className='w-4 h-4 text-gray-300'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
              />
            </svg>
            <span className='text-gray-100'>{email}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Tooltip
      label={name ? tooltipContent : ''}
      position='top'
      withArrow
      arrowSize={6}
      radius='md'
      offset={8}
      transitionProps={{
        transition: 'fade',
        duration: 200,
      }}
      styles={{
        tooltip: {
          backgroundColor: 'transparent',
          border: 'none',
          padding: 0,
        },
      }}
    >
      {avatarElement}
    </Tooltip>
  );
};

export default Avatar;
