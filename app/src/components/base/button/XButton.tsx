import { IconX } from '@tabler/icons-react';
import { cn } from '../../../utils/helper';

export type TXButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function XButton({ className, ...props }: TXButtonProps) {
  return (
    <button {...props} className={cn('cursor-pointer', className)}>
      <IconX size={16} />
    </button>
  );
}
