import type { TFormSelectProps } from '../../../../../components/base/FormSelect';
import type { TPhase } from '../../../../../store/types/phase.types';

export type TAddPhaseSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  phaseData?: TPhase | null;
  mode?: 'create' | 'edit';
};
export type TTaskSelectorProps = TFormSelectProps & {
  selectedTask: string | undefined | null;
  setSelectedTask: (taskId: string | null) => void;
  className?: string;
  allowFilter?: boolean;
  error?: string;
  phaseId?: string;
  disabled?: boolean;
  setSearchValue?: (arg: string | null) => void;
};
