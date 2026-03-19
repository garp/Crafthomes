import { ActionButton } from './ActionButton';
import { IconCopy } from '@tabler/icons-react';

interface CopyButtonProps {
  onCopy?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
}

export const CopyButton = ({
  onCopy,
  tooltip = 'Copy',
  disabled = false,
  className = '',
  iconClassName,
}: CopyButtonProps) => {
  return (
    <ActionButton
      icon={<IconCopy className={`w-4 h-4 ${iconClassName}`} />}
      tooltip={tooltip}
      variant='default'
      onClick={onCopy}
      disabled={disabled}
      className={className}
    />
  );
};
