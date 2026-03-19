import { ActionButton } from './ActionButton';
import { EditIcon } from '../../icons';

interface EditButtonProps {
  onEdit?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
}

export const EditButton = ({
  onEdit,
  tooltip = 'Edit',
  disabled = false,
  className = '',
  iconClassName,
}: EditButtonProps) => {
  return (
    <ActionButton
      icon={<EditIcon className={`w-4 h-4 ${iconClassName}`} />}
      tooltip={tooltip}
      variant='edit'
      onClick={onEdit}
      disabled={disabled}
      className={className}
    />
  );
};
