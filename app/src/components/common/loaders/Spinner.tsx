import { IconLoader2 } from '@tabler/icons-react';
import { cn } from '../../../utils/helper';

export default function Spinner({ className }: { className?: string }) {
  return (
    <>
      <IconLoader2 className={cn('animate-spin', className)} />
    </>
  );
}
