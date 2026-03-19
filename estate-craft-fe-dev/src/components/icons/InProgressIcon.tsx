import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
}

export const InProgressIcon: React.FC<IconProps> = ({
  className = 'w-3 h-3',
  color = '#7B56FC',
}) => {
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
        d='M5.99984 11.8337C9.22147 11.8337 11.8332 9.22196 11.8332 6.00033C11.8332 2.77866 9.22147 0.166992 5.99984 0.166992C2.77817 0.166992 0.166504 2.77866 0.166504 6.00033C0.166504 9.22196 2.77817 11.8337 5.99984 11.8337ZM5.99984 6.00033V2.50033C6.96636 2.50033 7.84136 2.89207 8.47469 3.52545L5.99984 6.00033Z'
        fill={color}
      />
    </svg>
  );
};
