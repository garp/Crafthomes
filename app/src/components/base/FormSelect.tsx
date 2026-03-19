import { Select, type SelectProps } from '@mantine/core';
import { cn } from '../../utils/helper';
import { motion } from 'framer-motion';

export type TFormSelectProps = SelectProps & {
  inputClassName?: string;
  options?: { label: string; value: string; icon?: string }[] | undefined;
  labelClassName?: string;
  noOptionsPlaceholder?: string;
  renderOption?: SelectProps['renderOption'];
};
export default function FormSelect({
  // onChange,
  // value,
  // required = true,
  // className,
  // placeholder,
  options,
  labelClassName,
  error,
  inputClassName,
  className,
  noOptionsPlaceholder = 'No options available',
  renderOption,
  ...props
}: TFormSelectProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('', className)}
    >
      <Select
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
            `!py-5.5 !font-medium`,
            inputClassName,
          ),
          root: cn('w-full'),
        }}
        comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
        checkIconPosition='right'
        error={error}
        renderOption={renderOption}
        // className={cn(`hover:scale-[1.01] transition-transform duration-300`, className)}
        {...props}
      />
    </motion.div>
  );
}
