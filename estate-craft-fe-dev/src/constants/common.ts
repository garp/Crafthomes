import type { TFormSelectProps } from '../components/base/FormSelect';
export const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const ADD_TASK_INITIAL_VALUES = {
  name: '',
  // description: '',
  // plannedStart: new Date(),
  // plannedEnd: new Date(Date.now() + +3600 * 1000 * 24),
  // assignee: '',
  // assignedBy: '',
  // priority: '',
  // phaseId: '',
};

export type TStatusFilterProps = TFormSelectProps & {};

export type TBaseSearchSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
  name?: string;
  label?: string;
};
export const itemVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.1,
    },
  },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
