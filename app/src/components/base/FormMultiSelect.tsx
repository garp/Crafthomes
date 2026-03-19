import { MultiSelect, type MultiSelectProps } from '@mantine/core';
import { cn } from '../../utils/helper';
import { motion } from 'framer-motion';

export type TFormMultiSelectProps = MultiSelectProps & {
  inputClassName?: string;
  options?: { label: string; value: string }[];
  labelClassName?: string;
  noOptionsPlaceholder?: string;
};

export default function FormMultiSelect({
  options,
  labelClassName,
  error,
  inputClassName,
  className,
  noOptionsPlaceholder = 'No options available',
  ...props
}: TFormMultiSelectProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('', className)}
    >
      <MultiSelect
        data={
          options?.length === 0
            ? [{ label: noOptionsPlaceholder, value: '__no_options__', disabled: true }]
            : options
        }
        classNames={{
          label: cn('text-text-subHeading ', labelClassName),
          input: cn(
            `transition-all duration-200`,
            `focus:!border-neutral-300 focus:!ring-neutral-100 !focus:shadow-sh1 !shadow-sm`,
            error && '!border-red-500 focus:!border-red-500 focus:!ring-red-100',
            `!py-1.5 !font-medium !min-h-[42px]`,
            inputClassName,
          ),
          root: cn('w-full'),
        }}
        comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
        checkIconPosition='right'
        error={error}
        clearable
        searchable
        {...props}
      />
    </motion.div>
  );
}
