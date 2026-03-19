import { toast } from 'react-toastify';

import type { TAddMasterTaskSidebarProps } from '../../types/settings.types';
import { type TCreateMasterTaskFormData } from '../../validators/masterTask';
import type { TErrorResponse } from '../../store/types/common.types';
import { useCreateMasterTaskMutation } from '../../store/services/masterTask/masterTask';

import SidebarModal from '../base/SidebarModal';
import MasterTaskForm from './MasterTaskForm';
import type { TOnSubmitArgs, TOption } from '../../types/common.types';

export default function AddMasterTaskSidebar({
  isOpen,
  onClose,
  initialValues,
  defaultPhaseData,
  onCreated,
  projectTypeId,
}: TAddMasterTaskSidebarProps & {
  initialValues?: TCreateMasterTaskFormData | null;
  defaultPhaseData?: TOption[] | null;
  onCreated?: (taskId: string, taskName: string) => void;
  projectTypeId?: string;
}) {
  const [createTask, { isLoading }] = useCreateMasterTaskMutation();
  const handleSubmit = async ({ data, resetForm }: TOnSubmitArgs<TCreateMasterTaskFormData>) => {
    createTask(data)
      .unwrap()
      .then((response: any) => {
        toast.success('Task created successfully');
        // Call onCreated with the new task ID and name
        // The response might have the ID in different places depending on API structure
        const taskId = response?.data?.id || response?.id || response?.data?.task?.id;
        if (onCreated && taskId) {
          onCreated(taskId, data.name);
        } else if (onCreated) {
          // If no ID in response, pass the name and let the parent handle it
          onCreated('', data.name);
        }
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.error('Error creating task:', error);
      });
  };

  const defaultInitialValues: TCreateMasterTaskFormData = {
    name: '',
    masterPhaseId: [],
    duration: null,
    predecessorTaskId: null,
    priority: 'MEDIUM',
    subTasks: [],
  };
  const formInitialValues = initialValues
    ? {
        ...defaultInitialValues,
        ...initialValues,
        priority: initialValues.priority || defaultInitialValues.priority,
      }
    : defaultInitialValues;

  return (
    <SidebarModal heading='Add Master Task' opened={isOpen} onClose={onClose}>
      <MasterTaskForm
        mode='create'
        disabled={isLoading}
        initialValues={formInitialValues}
        onSubmit={handleSubmit}
        defaultData={defaultPhaseData || undefined}
        projectTypeId={projectTypeId}
      />
    </SidebarModal>
  );
}
