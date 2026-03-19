import { cn } from '../../utils/helper';
import FormLabel from './FormLabel';

export default function FormRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center', className)}>
      <FormLabel className='w-[40%]'>{label}</FormLabel>
      <div className='w-[60%]'>{children}</div>
    </div>
  );
}
