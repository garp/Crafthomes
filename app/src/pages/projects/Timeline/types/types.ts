import type { TProjectTask } from '../../../../store/types/projectTask.types';
import type { TTimeline } from '../../../../store/types/timeline.types';

export type TAddTimelineSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};
// export type TTaskSelectorProps = {
//   selectedTask: string | undefined;
//   setSelectedTask: (taskId: string) => void;
//   className?: string;
//   allowFilter?: boolean;
//   error?: string;
//   phaseId?: string;
// };
export type TAddProjectTaskSidebarProps = {
  opened: boolean;
  onClose: () => void;
  phaseId: string;
};

export type TEditProjectTaskSidebarProps = {
  opened: boolean;
  onClose: () => void;
  phaseId: string;
  task: TProjectTask | null;
};

export type TEditTimelineSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  timeline: TTimeline | null;
};
