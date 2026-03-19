import { toast } from 'react-toastify';

import type { TEditTaskSidebarProps } from '../../types/settings.types';
import { type TCreateMasterTaskFormData } from '../../validators/masterTask';
import { useUpdateMasterTaskMutation } from '../../store/services/masterTask/masterTask';
import type { TErrorResponse } from '../../store/types/common.types';

import MasterTaskForm from './MasterTaskForm';
import type { TOnSubmitArgs } from '../../types/common.types';
import SidebarModal from '../base/SidebarModal';

export default function EditMasterTaskSidebar({
  isOpen,
  onClose,
  taskData,
  projectTypeId,
}: TEditTaskSidebarProps) {
  const [updateTask, { isLoading }] = useUpdateMasterTaskMutation();
  const initialValues = {
    name: taskData?.name || '',
    masterPhaseId: taskData?.MasterPhaseMasterTask?.map((mt) => mt?.MasterPhase?.id) || [],
    description: taskData?.description || '',
    duration: taskData?.duration ?? null,
    predecessorTaskId: taskData?.predecessorTaskId ?? null,
    priority: taskData?.priority || '',
    subTasks: taskData?.subTasks || [],
    // notes: '',
  };

  function handleSubmit({ data, resetForm }: TOnSubmitArgs<TCreateMasterTaskFormData>) {
    if (!taskData?.id) return;
    updateTask({ id: taskData?.id, ...data })
      .unwrap()
      .then(() => {
        toast.success('Task updated successfully');
        onClose();
        resetForm();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error updating task:', error);
      });
  }
  // useEffect(() => {
  //   if (taskData) {
  //   } else {
  //     if (initialData && !options.length) setOptions(mapToOptions(initialData));
  //   }
  // }, [initialData]);
  return (
    <SidebarModal heading='Edit Master Task' opened={isOpen} onClose={onClose}>
      <MasterTaskForm
        // defaultSearchValue={taskData?.?.name}
        mode='edit'
        disabled={isLoading}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        taskId={taskData?.id}
        predecessorTaskName={taskData?.predecessorTask?.name}
        defaultData={taskData?.MasterPhaseMasterTask?.map((mt) => ({
          value: mt?.MasterPhase?.id,
          label: mt?.MasterPhase?.name,
        }))}
        projectTypeId={projectTypeId}
      />
    </SidebarModal>
  );
}
