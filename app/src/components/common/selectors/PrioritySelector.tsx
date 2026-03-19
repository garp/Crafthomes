import { priorityOptions } from '../../../constants/common';
import FormSelect, { type TFormSelectProps } from '../../base/FormSelect';
// import { priorityOptions } from '../../../pages/projects/Task/constants/constants';

export default function PrioritySelector({ ...props }: TFormSelectProps) {
  return (
    <FormSelect
      placeholder='Select Priority'
      name='priority'
      options={priorityOptions}
      {...props}
    />
  );
}
