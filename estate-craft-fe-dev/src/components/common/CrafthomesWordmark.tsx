import { cn } from '../../utils/helper';

type Props = { className?: string };

/** Plain-text product mark (replaces image logo). */
export function CrafthomesWordmark({ className }: Props) {
  return (
    <span className={cn('font-semibold tracking-tight text-gray-900 select-none', className)}>
      Crafthomes
    </span>
  );
}
