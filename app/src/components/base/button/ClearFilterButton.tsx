import { Tooltip } from '@mantine/core';
import { IconClearAll } from '@tabler/icons-react';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { cn } from '../../../utils/helper';

export default function ClearFilterButton({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  const { deleteAllParams } = useUrlSearchParams();
  return (
    <Tooltip label='Clear filters'>
      <button
        className={cn(
          'bg-bg  !h-12 px-3 rounded-lg cursor-pointer hover:delay-200 shadow-sm',
          className,
        )}
        onClick={() => {
          if (onClick) {
            onClick();
            return;
          }
          deleteAllParams();
        }}
      >
        <IconClearAll size={25} />
      </button>
    </Tooltip>
  );
}
