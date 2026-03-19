import { cn } from '../../utils/helper';
import type { TBadgeProps } from '../../types/common.types';

export default function Badge({ title, className, borderColor }: TBadgeProps) {
  return (
    <div
      className={cn(
        `text-sm flex gap-2 items-center relative whitespace-nowrap  rounded-full px-3 py-1 font-medium `,
        className,
      )}
    >
      <span className={`rounded-full border-[3.5px] ${borderColor}`} />
      {title}
    </div>
  );
}
