import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
}

export const NotificationIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
  color = 'currentColor',
}) => {
  return (
    <svg className={className} viewBox='0 0 18 19' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M15.6665 13.167H17.3332V14.8337H0.666504V13.167H2.33317V7.33366C2.33317 3.65176 5.31794 0.666992 8.99984 0.666992C12.6818 0.666992 15.6665 3.65176 15.6665 7.33366V13.167ZM13.9998 13.167V7.33366C13.9998 4.57223 11.7613 2.33366 8.99984 2.33366C6.23841 2.33366 3.99984 4.57223 3.99984 7.33366V13.167H13.9998ZM6.49984 16.5003H11.4998V18.167H6.49984V16.5003Z'
        fill={color}
      />
    </svg>
  );
};
