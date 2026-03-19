import React, { type ReactNode } from 'react';

type TIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export default function IconButton({ children, className, ...props }: TIconButtonProps) {
  return (
    <>
      <button
        className={`cursor-pointer size-8 flex justify-center items-center rounded-full hover:bg-gray-200 shrink-0 ${className} `}
        {...props}
      >
        {children}
      </button>
    </>
  );
}
