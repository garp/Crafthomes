import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
}

export const OverdueIcon: React.FC<IconProps> = ({ className = 'w-3 h-3', color = '#FC3400' }) => {
  return (
    <svg
      className={className}
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9.691 1.48421L5.17489 6.00033L5.99984 6.82528L10.5159 2.30917C11.3391 3.3149 11.8332 4.60027 11.8332 6.00033C11.8332 9.22033 9.21984 11.8337 5.99984 11.8337C2.77984 11.8337 0.166504 9.22033 0.166504 6.00033C0.166504 2.78033 2.77984 0.166992 5.99984 0.166992C7.3999 0.166992 8.68527 0.661046 9.691 1.48421Z'
        fill={color}
      />
    </svg>
  );
};
