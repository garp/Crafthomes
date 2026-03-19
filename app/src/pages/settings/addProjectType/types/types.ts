import type { TDialogModalProps } from '../../../../types/base';

export type TAddTaskDialogProps = TDialogModalProps & {
  activePhaseId: string;
  disabled: boolean;
};
