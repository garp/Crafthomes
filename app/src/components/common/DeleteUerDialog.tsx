import { Modal } from '@mantine/core';
import type { TDeleteUseDialogProps } from '../../types/users';

export default function DeleteUerDialog({ onClose, opened }: TDeleteUseDialogProps) {
  return <Modal opened={opened} onClose={onClose} title=''></Modal>;
}
