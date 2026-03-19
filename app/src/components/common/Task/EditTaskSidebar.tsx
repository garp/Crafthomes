import { toast } from 'react-toastify';
import { useGetSubTasksQuery } from '../../../store/services/subtask/subtaskSlice';
import { type TCreateTaskFormData } from '../../../validators/task';
import type { TErrorResponse } from '../../../store/types/common.types';
import {
  useApproveTaskMutation,
  useEditTaskMutation,
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
} from '../../../store/services/task/taskSlice';
import type { TEditTaskSidebarProps, TOnSubmitArgs } from '../../../types/common.types';

import { useDisclosure } from '@mantine/hooks';

import { useMemo, useState } from 'react';
import SidebarModal from '../../base/SidebarModal';
import { EditTaskSidebarSkeleton } from '../../base/Skeletons';
import TaskForm from './TaskForm';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import type { TCreateTaskBody } from '../../../store/types/task.types';
import ModalWrapper from '../../base/ModalWrapper';
import { Button } from '../../base';
import AlertModal from '../../base/AlertModal';
import { getUser } from '../../../utils/auth';
import { TASK_STATUS } from '../../../constants/ui';
import { isTaskApproved } from '../../../utils/helper';
import { format } from 'date-fns';

// Helper function to map API taskStatus string to valid TASK_STATUS value
function mapTaskStatus(
  status: string | undefined,
): (typeof TASK_STATUS)[keyof typeof TASK_STATUS] | undefined {
  if (!status) return undefined;

  // Normalize the status string (handle both enum values and display values)
  const normalizedStatus = status.trim();

  // Check against TASK_STATUS values
  if (normalizedStatus === 'Pending' || normalizedStatus === 'PENDING') {
    return TASK_STATUS.PENDING;
  }
  if (normalizedStatus === 'In Progress' || normalizedStatus === 'IN_PROGRESS') {
    return TASK_STATUS.IN_PROGRESS;
  }
  if (normalizedStatus === 'Completed' || normalizedStatus === 'COMPLETED') {
    return TASK_STATUS.COMPLETED;
  }
  if (normalizedStatus === 'Blocked' || normalizedStatus === 'BLOCKED') {
    return TASK_STATUS.BLOCKED;
  }

  return undefined;
}

export default function EditTaskSidebar({ isOpen, onClose, task }: TEditTaskSidebarProps) {
  const { deleteParams } = useUrlSearchParams();
  const currentUser = getUser();
  const [approveTask, { isLoading: isApprovingTask }] = useApproveTaskMutation();
  const [updateTask, { isLoading: isUpdatingTask }] = useEditTaskMutation();
  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, { open: openDiscardConfirm, close: closeDiscardConfirm }] =
    useDisclosure(false);
  const [showDeleteConfirm, { open: openDeleteConfirm, close: closeDeleteConfirm }] =
    useDisclosure(false);
  const [showApproveConfirm, { open: openApproveConfirm, close: closeApproveConfirm }] =
    useDisclosure(false);

  // Determine if we already have sufficient task data from the list (clicked from card)
  // vs only having task ID (opened via URL)
  const hasFullTaskData = !!(task?.id && task?.name);

  // Fetch complete task data only when we don't have full data
  // (e.g., opened via URL where task = { id: taskIdFromUrl })
  const { data: fetchedTaskData, isLoading: isTaskLoading } = useGetTaskByIdQuery(
    { id: task?.id || '' },
    { skip: !task?.id || hasFullTaskData },
  );

  // When opened from list/card we have full task prop → use it. When opened from URL we only have { id } → use fetched data.
  // Otherwise after reload, opening another task would still show the first task (cached fetchedTaskData from the URL taskId).
  const taskData = hasFullTaskData
    ? task
    : fetchedTaskData
      ? { ...fetchedTaskData, phase: task?.phase || fetchedTaskData.phase }
      : task;

  const isSuperAdmin = currentUser?.role?.name === 'super_admin';
  const projectManagerId =
    taskData?.project?.assignProjectManager || taskData?.phase?.project?.assignProjectManager;
  const canApproveTask =
    !!taskData?.id &&
    taskData?.taskStatus === TASK_STATUS.COMPLETED &&
    taskData?.approvalStatus !== 'APPROVED' &&
    (isSuperAdmin || projectManagerId === currentUser?.id);
  const isApprovedTask = isTaskApproved(taskData);

  // Fetch subtasks for the task
  const { data: fetchedSubTasks } = useGetSubTasksQuery(
    { parentTaskId: taskData?.id || '' },
    { skip: !taskData?.id },
  );
  // const [uploadFiles, { isLoading: isUploadingFiles }] = useUploadFilesMutation();
  // const [deleteFile, { isLoading: isDeletingFile }] = useDeleteFileMutation();

  const initialValues: TCreateTaskFormData = useMemo(() => {
    if (!taskData) {
      return {
        name: '',
        assignee: [],
        taskStatus: TASK_STATUS.PENDING,
      };
    }

    // Convert assigneeUser to array format (handle both single and array)
    const getAssigneeIds = (
      assigneeUser: typeof taskData.assigneeUser,
      taskAssignee: typeof taskData.TaskAssignee,
    ) => {
      // Priority 1: Use TaskAssignee if available
      if (taskAssignee && Array.isArray(taskAssignee) && taskAssignee.length > 0) {
        return taskAssignee
          .filter((ta) => ta?.User?.id) // Filter out invalid entries
          .map((ta) => ta?.User?.id)
          .filter((id): id is string => typeof id === 'string'); // Type guard to ensure string[]
      }
      // Priority 2: Fallback to assigneeUser
      if (!assigneeUser) return [];
      if (Array.isArray(assigneeUser)) {
        return assigneeUser
          .filter((u) => u?.id) // Filter out invalid entries
          .map((u) => u.id);
      }
      return assigneeUser?.id ? [assigneeUser.id] : [];
    };

    return {
      assignedBy: taskData?.assignedByUser?.id || currentUser?.id || '',
      assignee: getAssigneeIds(taskData?.assigneeUser || [], taskData?.TaskAssignee || []),
      attachment: taskData?.attachment,
      description: taskData?.description,
      name: taskData?.name ?? '',
      // notes: taskData?.notes,
      phaseId: taskData?.phase?.id || task?.phase?.id, // Prioritize phase from prop (current UI state)
      plannedEnd: taskData?.plannedEnd ? new Date(taskData.plannedEnd) : undefined,
      plannedStart: taskData?.plannedStart ? new Date(taskData.plannedStart) : undefined,
      duration: taskData?.duration,
      priority: taskData?.priority,
      predecessorTaskIds: (() => {
        // Handle multiple predecessor tasks from API
        // API returns "predecessors" array with each item having "predecessorTaskId" and "predecessorTask"
        const predecessors = (taskData as any)?.predecessors;
        if (Array.isArray(predecessors) && predecessors.length > 0) {
          return predecessors
            .map((p: any) => p?.predecessorTaskId || p?.predecessorTask?.id)
            .filter((id: any): id is string => typeof id === 'string');
        }
        // Fallback: Check for predecessorTasks (plural) array
        const predecessorTasks = (taskData as any)?.predecessorTasks;
        if (Array.isArray(predecessorTasks) && predecessorTasks.length > 0) {
          return predecessorTasks
            .map((task: any) => task?.id)
            .filter((id: any): id is string => typeof id === 'string');
        }
        // Fallback to single predecessorTask
        if (taskData?.predecessorTask?.id) {
          return [taskData.predecessorTask.id];
        }
        // Also check predecessorTaskId as a fallback
        if (taskData?.predecessorTaskId) {
          return [taskData.predecessorTaskId];
        }
        return [];
      })(),
      taskStatus: mapTaskStatus(taskData?.taskStatus || taskData?.status),
      // comment: task?.comments,
      subTasks: (() => {
        // Get subtasks from API or task object
        let subtasksArray: any[] = [];

        if (fetchedSubTasks?.subTasks && Array.isArray(fetchedSubTasks.subTasks)) {
          subtasksArray = fetchedSubTasks.subTasks;
        } else if (Array.isArray(taskData?.subTask)) {
          subtasksArray = taskData.subTask;
        }

        return subtasksArray.map((s) => {
          // Helper to get assignee IDs from assigneeUser (can be null, object, or array)
          const getAssigneeIdsFromSubtask = (assigneeUser: any) => {
            if (!assigneeUser) return [];
            if (Array.isArray(assigneeUser)) {
              return assigneeUser.map((u: any) => u?.id).filter(Boolean);
            }
            return assigneeUser?.id ? [assigneeUser.id] : [];
          };

          // Preserve all fields from API response
          const subtaskData: any = {
            ...s, // Include all properties including id, name, taskStatus, assignedByUser, assigneeUser, predecessorTask
            // Map fields that might be needed for form
            attachment: s?.attachment || [],
            description: s?.description || '',
            name: s?.name || '',
            taskStatus: s?.taskStatus || s?.status || 'PENDING',
            phaseId: s?.phaseId || taskData?.phase?.id,
            plannedEnd: s?.plannedEnd ? new Date(s.plannedEnd) : undefined,
            plannedStart: s?.plannedStart ? new Date(s.plannedStart) : undefined,
            priority: s?.priority || '',
            predecessorTaskIds: (() => {
              // Handle predecessors array (same structure as parent task)
              const predecessors = s?.predecessors;
              if (Array.isArray(predecessors) && predecessors.length > 0) {
                return predecessors
                  .map((p: any) => p?.predecessorTaskId || p?.predecessorTask?.id)
                  .filter((id: any): id is string => typeof id === 'string');
              }
              // Fallback to single predecessorTask
              if (s?.predecessorTask?.id) {
                return [s.predecessorTask.id];
              }
              if (s?.predecessorTaskId) {
                return [s.predecessorTaskId];
              }
              return [];
            })(),
            assignee: getAssigneeIdsFromSubtask(s?.assigneeUser),
            assignedBy: s?.assignedByUser?.id || '',
          };
          return subtaskData;
        });
      })(),
      // unit: taskData?.unit,
    };
  }, [taskData, fetchedSubTasks, currentUser?.id]);

  function handleCloseSidebar() {
    if (isDirty) {
      openDiscardConfirm();
    } else {
      closeSidebar();
    }
  }

  function closeSidebar() {
    setIsDirty(false);
    onClose();
    deleteParams(['taskId']);
  }

  function handleDiscardChanges() {
    closeDiscardConfirm();
    closeSidebar();
  }

  function handleCancelDiscard() {
    closeDiscardConfirm();
  }

  function handleDeleteClick() {
    openDeleteConfirm();
  }

  function handleDeleteTask() {
    if (!taskData?.id) {
      toast.error('Unable to delete task');
      return;
    }
    deleteTask({ id: taskData.id })
      .unwrap()
      .then(() => {
        toast.success('Task deleted successfully');
        closeDeleteConfirm();
        closeSidebar();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Internal server error');
        }
        console.error('Error deleting task:', error);
      });
  }

  function handleApproveTask() {
    if (!taskData?.id) {
      toast.error('Unable to approve task');
      return;
    }
    if (isDirty) {
      toast.error('Please save or discard your changes before approving this task');
      return;
    }

    openApproveConfirm();
  }

  function handleApproveConfirmed() {
    if (!taskData?.id) {
      toast.error('Unable to approve task');
      return;
    }

    approveTask({ id: taskData.id })
      .unwrap()
      .then(() => {
        toast.success('Task approved successfully');
        closeApproveConfirm();
        closeSidebar();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Unable to approve task');
      });
  }

  function handleSubmit({ data, resetForm }: TOnSubmitArgs<TCreateTaskFormData>) {
    // Exclude subTasks and filter null/undefined, also exclude taskStatus if null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subTasks, ...dataWithoutSubTasks } = data;
    const filtered = Object.fromEntries(
      Object.entries(dataWithoutSubTasks).filter(([key, v]) => {
        // Exclude null/undefined values
        if (v === null || v === undefined) return false;
        // Exclude taskStatus if it's null (handle case where it might be in data)
        if (key === 'taskStatus' && (v === null || v === undefined)) return false;
        return true;
      }),
    ) as unknown as TCreateTaskBody;

    // Convert duration to string if it exists
    if (filtered && typeof filtered.duration === 'number') {
      filtered.duration = String(filtered.duration) as any;
    }

    // Convert predecessorTaskIds array to the format expected by API
    // If backend expects array, keep it; if it expects single value, take first one
    // For now, assuming backend supports array - adjust if needed
    const payload: TCreateTaskBody & { name: string } = {
      ...filtered,
      name: (filtered?.name || taskData?.name || '') as string,
    };
    if (payload.predecessorTaskIds && Array.isArray(payload.predecessorTaskIds)) {
      // Keep as array for multiple predecessors
      // If backend only supports single, uncomment: payload.predecessorTaskId = payload.predecessorTaskIds[0] || null;
    }

    console.log({ payload });
    updateTask({ id: taskData?.id || '', ...payload })
      .unwrap()
      .then(() => {
        toast.success('Task updated successfully');
        resetForm();
        setIsDirty(false);
        closeSidebar();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Unable to update Task');
        console.error('Error in updating Task:', error);
      });
  }

  // const disabled = isUploadingFiles || isUpdatingTask || isDeletingFile;

  // Show skeleton only when:
  // 1. We have a task ID (sidebar should show something)
  // 2. We're loading from API (no full data from list)
  // 3. We don't have task data yet (API hasn't returned)
  const showSkeleton = !!task?.id && !hasFullTaskData && isTaskLoading && !fetchedTaskData;

  return (
    <>
      <SidebarModal heading='Edit Task' opened={isOpen} onClose={handleCloseSidebar}>
        {showSkeleton && <EditTaskSidebarSkeleton />}
        {taskData && !showSkeleton && (
          <>
            {isApprovedTask && (
              <div className='mx-4 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>
                  Approved
                </p>
                <p className='text-sm font-medium text-emerald-900'>
                  Approved by {taskData?.approvedByUser?.name || '—'}
                </p>
                {taskData?.approvedAt && (
                  <p className='text-xs text-emerald-700 mt-1'>
                    {format(new Date(taskData.approvedAt), 'dd MMM yyyy, hh:mm a')}
                  </p>
                )}
              </div>
            )}
            <TaskForm
              disabled={isUpdatingTask || isApprovedTask}
              initialValues={initialValues}
              mode='edit'
              onSubmit={handleSubmit}
              onClose={onClose}
              onDirtyChange={setIsDirty}
              onDelete={isApprovedTask ? undefined : handleDeleteClick}
              defaultPhase={task?.phase || taskData?.phase}
              taskId={taskData?.id}
              taskStatus={taskData?.taskStatus}
              taskStatusAlt={taskData?.status}
              onApprove={handleApproveTask}
              showApproveButton={canApproveTask}
              isApproving={isApprovingTask}
            />
          </>
        )}
      </SidebarModal>

      {/* Discard Changes Confirmation Modal */}
      <ModalWrapper
        opened={showDiscardConfirm}
        onClose={handleCancelDiscard}
        title='Discard Changes?'
        centered
      >
        <p className='font-medium text-text-subHeading'>
          You have unsaved changes. Are you sure you want to discard them?
        </p>
        <div className='flex justify-end gap-3 mt-8'>
          <Button onClick={handleCancelDiscard} variant='outline'>
            Cancel
          </Button>
          <Button onClick={handleDiscardChanges} className='bg-red-500 hover:bg-red-600'>
            Discard Changes
          </Button>
        </div>
      </ModalWrapper>

      {/* Delete Task Confirmation Modal */}
      <AlertModal
        title={`Delete ${taskData?.name}?`}
        subtitle="This action can't be undone"
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteTask}
        opened={showDeleteConfirm}
        isLoading={isDeletingTask}
      />
      <ModalWrapper
        opened={showApproveConfirm}
        onClose={closeApproveConfirm}
        title='Approve Task?'
        centered
      >
        <p className='font-medium text-text-subHeading'>
          Do you want to approve this task? After approval, you cannot edit this task.
        </p>
        <div className='flex flex-wrap justify-end gap-3 mt-8'>
          <Button variant='outline' onClick={closeApproveConfirm} disabled={isApprovingTask}>
            Cancel
          </Button>
          <Button variant='outline' onClick={closeApproveConfirm} disabled={isApprovingTask}>
            View Task
          </Button>
          <Button onClick={handleApproveConfirmed} disabled={isApprovingTask}>
            {isApprovingTask ? 'Approving...' : 'Approve'}
          </Button>
        </div>
      </ModalWrapper>
    </>
  );
}

// Reuse SubTask from AddTaskSidebar
export { SubTask } from './AddTaskSidebar';
