import { cn } from '../../utils/helper';
import type { TFormLabelProps } from '../../types/base';

export default function FormLabel({ children, htmlFor, className }: TFormLabelProps) {
  return (
    <>
      <label
        htmlFor={htmlFor}
        className={cn(`text-sm font-semibold text-text-subHeading`, className)}
      >
        {children}
      </label>
    </>
  );
}
