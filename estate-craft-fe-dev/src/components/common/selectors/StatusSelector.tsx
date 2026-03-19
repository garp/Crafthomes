import { statusOptions, type TStatusFilterProps } from '../../../constants/common';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { cn } from '../../../utils/helper';
import FormSelect from '../../base/FormSelect';

export default function StatusSelector({
  className,
  inputClassName,
  ...props
}: TStatusFilterProps) {
  const { setParams, getParam } = useUrlSearchParams();
  return (
    <FormSelect
      options={statusOptions}
      clearable
      value={getParam('status')}
      onChange={(val) => setParams('status', val || '')}
      placeholder='Status'
      inputClassName={cn('!py-6 !border-0 !rounded-lg', inputClassName)}
      className={cn('min-w-40 max-w-max', className)}
      {...props}
    />
  );
}
