import { ActionButton } from './ActionButton';
import { DeleteIcon } from '../../icons';

interface DeleteButtonProps {
  onDelete?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
}

export const DeleteButton = ({
  onDelete,
  tooltip = 'Delete',
  disabled = false,
  className = '',
  iconClassName,
}: DeleteButtonProps) => {
  return (
    <ActionButton
      icon={<DeleteIcon className={`w-4 h-4 ${iconClassName}`} />}
      tooltip={tooltip}
      variant='delete'
      onClick={onDelete}
      disabled={disabled}
      className={className}
    />
  );
};
