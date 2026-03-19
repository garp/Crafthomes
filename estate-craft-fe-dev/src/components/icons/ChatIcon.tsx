import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
}

export const ChatIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
  color = 'currentColor',
}) => {
  return (
    <svg className={className} viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M0.666504 17.3337V2.33366C0.666504 1.87533 0.829698 1.48296 1.15609 1.15658C1.48248 0.830187 1.87484 0.666992 2.33317 0.666992H15.6665C16.1248 0.666992 16.5172 0.830187 16.8436 1.15658C17.17 1.48296 17.3332 1.87533 17.3332 2.33366V12.3337C17.3332 12.792 17.17 13.1844 16.8436 13.5107C16.5172 13.8371 16.1248 14.0003 15.6665 14.0003H3.99984L0.666504 17.3337ZM3.2915 12.3337H15.6665V2.33366H2.33317V13.2712L3.2915 12.3337Z'
        fill={color}
      />
    </svg>
  );
};
