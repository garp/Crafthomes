import { Textarea, type TextareaProps } from '@mantine/core';
import { cn } from '../../utils/helper';

export default function FormTextArea({
  rows = 5,
  labelClassName,
  ...props
}: TextareaProps & { labelClassName?: string }) {
  return (
    <>
      <Textarea
        {...props}
        rows={rows}
        classNames={{
          input: 'placeholder:font-medium focus:!border-neutral-200  focus:!outline-none',
          root: 'focus-within:drop-shadow-[0_0px_1.5px_rgba(0,0,0,0.07)]',
          label: cn('text-text-subHeading', labelClassName),
        }}
      />
    </>
  );
}
