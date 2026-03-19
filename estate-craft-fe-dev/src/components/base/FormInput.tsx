import { TextInput } from '@mantine/core';
import { cn } from '../../utils/helper';
import type { TFormInputProps } from '../../types/common.types';
import { motion } from 'framer-motion';

export default function FormInput({
  className,
  labelClassName,
  inputClassName,
  error,
  ...props
}: TFormInputProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('w-full', className)}
    >
      <TextInput
        className={`w-full`}
        error={error}
        {...props}
        classNames={{
          label: cn('text-text-subHeading', labelClassName),
          input: cn(
            `!py-5.5 !font-medium !text-sm !rounded-[4px] `,
            `border transition-all duration-200`,
            `focus:!border-neutral-300 focus:!ring-neutral-100 focus:shadow-sh1`,
            error && '!border-red-500 focus:!border-red-500 focus:!ring-red-100',
            inputClassName,
          ),
          // root: 'hover:scale-[1.01] transition-transform duration-300',
        }}
      />
    </motion.div>
  );
}
