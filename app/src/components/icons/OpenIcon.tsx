import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
}

export const OpenIcon: React.FC<IconProps> = ({ className = 'w-3 h-3', color = '#549DD0' }) => {
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
        d='M11.25 0.750326V11.2551C11.25 11.5747 10.9905 11.8337 10.6705 11.8337H1.32948C1.00944 11.8337 0.75 11.5681 0.75 11.2551V0.745542C0.75 0.426021 1.00955 0.166992 1.32948 0.166992H10.6667C10.9888 0.166992 11.25 0.428162 11.25 0.750326ZM5.58752 6.65442L4.14384 5.21073L3.31889 6.03573L5.58752 8.30432L8.88732 5.00452L8.06237 4.17956L5.58752 6.65442Z'
        fill={color}
      />
    </svg>
  );
};
