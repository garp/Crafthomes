import { DateInput, type DateInputProps } from '@mantine/dates';
import { IconCalendarWeek } from '@tabler/icons-react';
import { cn } from '../../utils/helper';
import { motion } from 'framer-motion';

// type TFormDateProps = DateInputProps & {
//   // value: Date | null;
//   // onChange: (date: string | null) => void;
//   // placeholder?: string;
//   // className?: string;
// };

export default function FormDate({
  placeholder = 'Select Date',
  className,
  error,
  labelClassName,
  inputClassName,
  ...props
}: DateInputProps & {
  labelClassName?: string;
  inputClassName?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
}) {
  return (
    // <div>
    // <div className={cn(`flexitems-center border-[#D1D5DB] rounded-[6px]`, className)}>
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('w-full shadow-xs', className)}
    >
      <DateInput
        placeholder={placeholder}
        className={cn(`w-full`)}
        rightSection={<IconCalendarWeek className='text-gray-400' />}
        classNames={{
          input: cn(
            `!py-5.5 !font-medium`,
            inputClassName,
            error ? `border-red-200` : `!border-gray-300 `,
          ),
          label: cn('text-text-subHeading', labelClassName),
        }}
        {...props}
        error={error}
      />
    </motion.div>
    // </div>
    // </div>
  );
}
