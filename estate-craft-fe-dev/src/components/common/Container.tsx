import { cn } from '../../utils/helper';
import type { TContainerProps } from '../../types/common.types';

export default function Container({ className, children }: TContainerProps) {
  return (
    <div className={cn(`flex flex-col h-full rounded-md bg-white  px-5 py-5 shadow-lg`, className)}>
      {children}
    </div>
  );
}
