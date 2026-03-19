import { NumberInput } from '@mantine/core';
import { cn } from '../../utils/helper';
import type { TFormInputNumberProps } from '../../types/common.types';

export default function FormInputNumber({
  className,
  labelClassName,
  inputClassName,
  error,
  hideControls = true,
  ...props
}: TFormInputNumberProps) {
  return (
    <NumberInput
      hideControls={hideControls}
      className={className}
      error={error}
      {...props}
      classNames={{
        label: cn('text-text-subHeading', labelClassName),
        input: cn(
          `!py-5.5 !font-medium !text-sm !rounded-[4px] `,
          `focus:!border-neutral-300 focus:!ring-neutral-100 focus:!ring-2`,
          `border-gray-300 transition-all duration-200`,
          error && '!border-red-500 focus:!border-red-500 focus:!ring-red-100',
          inputClassName,
        ),
      }}
    />
  );
}
