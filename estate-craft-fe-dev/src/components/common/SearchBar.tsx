import type { TFormInputProps } from '../../types/common.types';
import { cn } from '../../utils/helper';
import FormInput from '../base/FormInput';
import { SearchIcon } from '../icons';
// import XButton from '../base/button/XButton';

export default function SearchBar({
  className,
  placeholder = 'Search',
  ...props
}: TFormInputProps) {
  return (
    <FormInput
      placeholder={placeholder}
      leftSection={<SearchIcon />}
      {...props}
      className={cn(`w-full overflow-hidden`, className)}
      inputClassName='!border-0 !py-6 !rounded-lg focus:!border-0 focus:!ring-0 focus:!shadow-none'
    />
  );
}
