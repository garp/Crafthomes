import {
  useAddMasterPhaseMutation,
  useUpdateMasterPhaseMutation,
} from '../../store/services/masterPhase/masterPhase';
import type { TAddEditMasterPhaseSidebarProps } from '../../types/settings.types';
import MasterPhaseForm from './MasterPhaseForm';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';
import type { TCreateMasterPhaseFormData } from '../../validators/masterPhase';
import type { TOnSubmitArgs } from '../../types/common.types';
import SidebarModal from '../base/SidebarModal';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import AddMasterTaskSidebar from './AddMasterTaskSidebar';
import EditMasterTaskSidebar from './EditMasterTaskSidebar';
import { useLazyGetMasterTasksQuery } from '../../store/services/masterTask/masterTask';
import type { TMasterTask } from '../../store/types/masterTask.types';

export default function AddEditMasterPhaseSidebar({
  isOpen,
  onClose,
  onSuccess,
  onPhaseUpdated,
  phaseData,
  mode = 'create',
  initialPhaseName,
  projectTypeId,
}: TAddEditMasterPhaseSidebarProps) {
  const [createPhase, { isLoading: isCreating }] = useAddMasterPhaseMutation();
  const [updatePhase, { isLoading: isUpdating }] = useUpdateMasterPhaseMutation();
  const [isOpenAddTask, { open: openAddTask, close: closeAddTask }] = useDisclosure(false);
  const [isOpenEditTask, { open: openEditTask, close: closeEditTask }] = useDisclosure(false);
  const [pendingTaskName, setPendingTaskName] = useState<string>('');
  const [selectedTaskData, setSelectedTaskData] = useState<TMasterTask | null>(null);
  const [getTaskById] = useLazyGetMasterTasksQuery();

  const isLoading = mode === 'create' ? isCreating : isUpdating;
  const heading = mode === 'create' ? 'Add Master Phase' : 'Edit Master Phase';

  const initialValues = {
    name: phaseData?.name || initialPhaseName || '',
    description: phaseData?.description || '',
  };

  function handleCreateFromSearch(taskName: string) {
    setPendingTaskName(taskName);
    openAddTask();
  }

  function handleTaskCreated(_taskId: string, taskName: string) {
    // Store the task name so MasterTaskSelector can auto-select it after refetch
    // The cache invalidation will trigger a refetch, and we'll find the task by name
    // We'll pass this to MasterPhaseForm which will pass it to MasterTaskSelector
    setPendingTaskName(taskName);
    closeAddTask();
    // Clear pending name after a longer delay to ensure the task is selected and persisted
    // The ref in MasterTaskSelector will preserve the selection even after pendingTaskName is cleared
    setTimeout(() => {
      setPendingTaskName('');
    }, 2000);
  }

  async function handleTaskClick(taskId: string) {
    try {
      const result = await getTaskById({ id: taskId });
      if (result.data?.masterTasks?.[0]) {
        setSelectedTaskData(result.data.masterTasks[0]);
        openEditTask();
      } else {
        toast.error('Task not found');
      }
    } catch (error) {
      toast.error('Unable to load task details');
      console.error('Error fetching task:', error);
    }
  }

  async function handleSubmit({ data, resetForm }: TOnSubmitArgs<TCreateMasterPhaseFormData>) {
    if (mode === 'create') {
      createPhase(data)
        .unwrap()
        .then(() => {
          toast.success('Master Phase created successfully');
          // Notify parent about the created phase name so it can be auto-selected
          onSuccess?.(data.name);
          resetForm();
          onClose();
        })
        .catch((error: { data: TErrorResponse }) => {
          if (error?.data?.message) toast.error(error?.data?.message);
          else toast.error('Unable to create Master phase');
          console.log('Error in creating Master phase:', error);
        });
    } else {
      // Edit mode
      if (!phaseData) {
        toast.error('Unable to update phase, please try again later.');
        return;
      }
      updatePhase({
        ...data,
        id: phaseData?.id,
      })
        .unwrap()
        .then(() => {
          toast.success('Phase updated successfully');
          // Notify parent about the updated phase so it can update the UI
          if (phaseData?.id && data.name) {
            onPhaseUpdated?.(phaseData.id, data.name);
          }
          resetForm();
          onClose();
        })
        .catch((error: { data: TErrorResponse }) => {
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else toast.error('Internal server error');
          console.log('Error in updating phase:', error);
        });
    }
  }

  return (
    <>
      <SidebarModal heading={heading} opened={isOpen} onClose={onClose}>
        <div className='h-full bg-white'>
          <MasterPhaseForm
            mode={mode}
            initialValues={
              mode === 'create' ? { name: initialPhaseName || '', description: '' } : initialValues
            }
            onSubmit={handleSubmit}
            disabled={isLoading}
            defaultTasks={
              mode === 'edit' && phaseData?.MasterPhaseMasterTask
                ? phaseData.MasterPhaseMasterTask.map((task) => ({
                    name: task?.MasterTask?.name,
                    id: task?.MasterTask?.id,
                  }))
                : undefined
            }
            onCreateFromSearch={handleCreateFromSearch}
            pendingTaskName={pendingTaskName}
            onTaskClick={handleTaskClick}
            projectTypeId={projectTypeId}
          />
        </div>
      </SidebarModal>
      <AddMasterTaskSidebar
        isOpen={isOpenAddTask}
        onClose={closeAddTask}
        initialValues={
          pendingTaskName
            ? {
                name: pendingTaskName,
                // Pre-select the current phase if in edit mode
                masterPhaseId: mode === 'edit' && phaseData?.id ? [phaseData.id] : [],
                priority: 'MEDIUM',
                subTasks: [],
              }
            : null
        }
        defaultPhaseData={
          // Pre-select the current phase when creating a task from within a phase
          mode === 'edit' && phaseData?.id ? [{ label: phaseData.name, value: phaseData.id }] : null
        }
        onCreated={handleTaskCreated}
        projectTypeId={projectTypeId}
      />
      <EditMasterTaskSidebar
        isOpen={isOpenEditTask}
        onClose={closeEditTask}
        taskData={selectedTaskData}
        projectTypeId={projectTypeId}
      />
    </>
  );
}
