import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import type { TSendMessageFormData } from './message.types';
import { type NumberInputProps, type TextInputProps } from '@mantine/core';
// import type { TProjectTask } from '../store/types/projectTask.types';

import type { TTask } from '../store/types/task.types';
import type { TFormSelectProps } from '../components/base/FormSelect';
// import type { TCreateSubTaskFormData, TCreateTaskFormData, } from '../validators/task';
// import type { FormikErrors, FormikTouched } from 'formik';

export type TRichTextEditorProps = {
  handleInputChange: (field: keyof TSendMessageFormData, value: string | Date | File) => void;
  value: string;
  isSubmitting: boolean;
  isFormValid: boolean;
};

export type TBadgeProps = {
  title: string;
  className?: string;
  borderColor?: string;
};

export type TContainerProps = PropsWithChildren & {
  className?: string;
};
export type TCreateScreenData = {
  heading: string;
  title: string;
  subtitle: string;
  buttonText: string;
};
export type TCreatePageProps = {
  createPageData: TCreateScreenData;
  onClick: () => void;
};

export type TProjectLayoutProps = PropsWithChildren & {
  // breadcrumbData: {
  //   title: string;
  //   link: string;
  // }[];
  className?: string;
};

export type TColoredBadgeProps = {
  label: string;
  className?: string;
};
export type TAlertModaProps = {
  // userId: string;
  subtitle?: string;
  onConfirm: () => void;
  isLoading: boolean;
};

export type TFormInputProps = TextInputProps & {
  labelClassName?: string;
  inputClassName?: string;
};
export type TFormInputNumberProps = NumberInputProps & {
  labelClassName?: string;
  inputClassName?: string;
  error?: string;
};
export type TMenuItem = {
  id: string;
  label: string;
  path: string;
  icon: any;
};

export type TBreadcrumbData = {
  title: string;
  link: string;
};

export type TeamMemberAvatarProps = {
  members: {
    id: string;
    name: string;
    initial: string;
    color: string;
    designation?: string;
  }[];
};

export type TTableSearchBarProps = {
  query: string;
  searchKey?: string;
  setQuery: Dispatch<SetStateAction<string>>;
  className?: string;
};

export type TPhaseSelectorProps = {
  // selectedPhase: string | null;
  // setSelectedPhase: Dispatch<SetStateAction<string | null>>;
  // className?: string;
  // value : string | undefined,
  defaultSearchValue?: string | undefined;
  setValue: (val: string | null) => void;
  allowFilter?: boolean;
};
export type TOption = {
  label: string;
  value: string;
};

export type TAddTaskSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  phaseId?: string;
  phaseName?: string;
  fixedProjectId?: string;
  /** When true, drawer renders with higher z-index so it appears on top of another open sidebar */
  stackOnTop?: boolean;
  /** Called with the created task after successful create (e.g. for optimistic cache update) */
  onTaskCreated?: (task: import('../store/types/task.types').TTask) => void;
};

export type TEditTaskSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  phaseId?: string;
  phaseName?: string;
  task: TTask | null;
};

export type TSubTaskProps = {
  subtask?: import('../store/types/task.types').TSubTask;
  index?: number;
  removeSubTask?: <X = any>(index: number) => X | undefined;
  onDelete?: () => void;
  taskDisabled?: boolean;
  // values: TCreateTaskFormData;
  // handleChange: (e: React.ChangeEvent<any>) => void
  // handleBlur: (e: React.FocusEvent<any>) => void
  // touched: FormikTouched<TCreateSubTaskFormData> | undefined,
  // errors: FormikErrors<TCreateSubTaskFormData> | undefined
  // setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
  // setFieldTouched: (field: string, touched?: boolean, shouldValidate?: boolean) => void
};

export type TAddSubTaskSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  index?: number;
  subtaskId?: string;
  subtask?: any; // TSubTask data prop-drilled from parent
};

export type TProjectSelectorProps = {
  // selectedProject: string | undefined | null;
  // setSelectedProject: (projectId: string | null) => void;
  className?: string;
  allowFilter?: boolean;
  error?: string;
  phaseId?: string;
  disabled?: boolean;
  inputClassName?: string;
  // searchValue?: string | undefined;
  // setSearchValue?: (val: string | undefined) => void;
  value: string | null;
  setValue: (val: string | null) => void;
};

export type TSearchSelectProps<T> = TFormSelectProps & {
  // value: string | null;
  setValue: (id: string | null) => void;
  // placeholder: string;
  allowFilter?: boolean;
  disabled?: boolean;
  // error?: string;
  /** Default data (paginated API, first load) */
  defaultData?: T;
  /** Search data (API result) */
  searchedData?: T;
  /** Trigger search (lazy query) */
  onSearch: (q: string) => void;
  /** Map API data → options { label, value }[] */
  mapToOptions: (data: T | undefined) => { label: string; value: string }[];
  paramKey?: string; // e.g. "taskId" | "projectId" | "phaseId"
  // className?: string;
  openAddModal?: TFunc;
  showSelectValue?: boolean;
  /** Optional create handler using the current search text */
  onCreateFromSearch?: (search: string) => void;
};

// export type TEditTaskSidebarProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   taskData: TMasterTask | null;
// };

export type TFormMode = 'create' | 'edit';

export type TFormProps<T> = {
  onSubmit: (args: TOnSubmitArgs<T>) => void;
  initialValues: T & { clientType?: 'INDIVIDUAL' | 'ORGANIZATION' };
  disabled: boolean;
  onClose?: () => void;
  mode: TFormMode;
  defaultSearchValue?: string;
};

export type TOnSubmitArgs<T> = {
  data: T;
  resetForm: () => void;
};

export type TPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TCreateFormSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};
export type TEditFormSidebarProps<T> = TCreateFormSidebarProps & {
  initialData: T | null;
};

export type TSearchableSelectProps = TFormSelectProps & {
  setValue: (val: string | null) => void;
  allowFilter?: boolean;
};

export type TSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type TFunc = () => void;
