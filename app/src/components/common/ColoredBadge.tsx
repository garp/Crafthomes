import type { TColoredBadgeProps } from '../../types/common.types';
import { cn } from '../../utils/helper';

export default function ColoredBadge({ label, className }: TColoredBadgeProps) {
  return (
    <div
      className={cn(`rounded-full px-5 py-1 font-semibold text-sm whitespace-nowrap`, className)}
    >
      {label}
    </div>
  );
}
