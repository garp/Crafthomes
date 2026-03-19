import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
}

export const CompletedIcon: React.FC<IconProps> = ({
  className = 'w-3 h-3',
  color = '#11C4A6',
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
        d='M5.99984 11.8337C9.22147 11.8337 11.8332 9.22196 11.8332 6.00033C11.8332 2.77866 9.22147 0.166992 5.99984 0.166992C2.77817 0.166992 0.166504 2.77866 0.166504 6.00033C0.166504 9.22196 2.77817 11.8337 5.99984 11.8337ZM9.18315 4.51697L5.4165 8.28361L2.96236 5.82947L3.78732 5.00452L5.4165 6.63371L8.3582 3.69201L9.18315 4.51697Z'
        fill={color}
      />
    </svg>
  );
};
