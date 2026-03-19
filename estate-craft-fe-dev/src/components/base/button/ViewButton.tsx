import { ActionButton } from './ActionButton';
import { IconEye } from '@tabler/icons-react';

type TViewButtonProps = {
  onView?: () => void;
  disabled?: boolean;
  className?: string;
  tooltip?: string;
  iconClassName?: string;
};

export const ViewButton = ({
  disabled = false,
  onView,
  className = '',
  tooltip = 'View',
  iconClassName,
}: TViewButtonProps) => {
  return (
    <>
      <ActionButton
        disabled={disabled}
        tooltip={tooltip}
        onClick={onView}
        className={className}
        icon={<IconEye className={iconClassName} />}
      />
    </>
  );
};
