import { Modal } from '@mantine/core';
import type { TDialogModalProps } from '../../types/base';
import { cn } from '../../utils/helper';

export default function DialogModal({
  children,
  centered = true,
  titleClassName,
  ...props
}: TDialogModalProps) {
  return (
    <Modal
      centered={centered}
      {...props}
      classNames={{
        title: cn(
          '!text-2xl !font-medium !truncate !overflow-hidden !whitespace-nowrap max-w-[90%]',
          titleClassName,
        ),
        content: '!ring-1 ring-neutral-200 ring-offset-4 shadow-xl ',
      }}
      overlayProps={{
        backgroundOpacity: 0,
        blur: 4,
      }}
    >
      {children}
    </Modal>
  );
}
