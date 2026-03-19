import React from 'react';

interface StepArrowIconProps {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

export const StepArrowIcon: React.FC<StepArrowIconProps> = ({
  width = 16,
  height = 10,
  className = '',
  color = '#519A2F',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 16 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M10.9124 0.791992L12.6425 2.43962L8.95578 5.95073L5.93393 3.07277L0.335938 8.41139L1.40114 9.42587L5.93393 5.10893L8.95578 7.98689L13.7152 3.4613L15.4452 5.10893V0.791992H10.9124Z'
        fill={color}
      />
    </svg>
  );
};
