import { useState, useMemo, useEffect } from 'react';
import { Table } from '@mantine/core';

// import { tasks } from '../constants/constants';

import StatusBadge from '../../../../components/common/StatusBadge';
import { DeleteButton, EditButton } from '../../../../components';
import { ActionButton } from '../../../../components/base/button/ActionButton';
import { IconCheck, IconCircleCheck } from '@tabler/icons-react';
import TableData from '../../../../components/base/table/TableData';
import FormSelect from '../../../../components/base/FormSelect';

import {
  useDeleteTaskMutation,
  useMarkTaskCompleteMutation,
  useEditTaskMutation,
  useGetTaskByIdQuery,
} from '../../../../store/services/task/taskSlice';
import ProgressCircle from '../../../../components/common/ProgressCircle';
// import CustomPagination from '../../../../components/base/CustomPagination';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import type { TTask } from '../../../../store/types/task.types';
import { useDisclosure } from '@mantine/hooks';
import EditTaskSidebar from '../../../../components/common/Task/EditTaskSidebar';
import AlertModal from '../../../../components/base/AlertModal';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
import { format } from 'date-fns';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import CustomCheckbox from '../../../../components/base/CustomCheckbox';
import {
  calculateDuration,
  getTaskAssigneeNames,
  isTaskApproved,
  isTaskCompleted,
} from '../../../../utils/helper';
import { TASK_STATUS_OPTIONS, TASK_STATUS } from '../../../../constants/ui';

// Component to handle inline status editing with predecessor validation
function InlineStatusEditor({
  task,
  onStatusUpdate,
}: {
  task: TTask;
  onStatusUpdate?: (
    taskId: string,
    newStatus: (typeof TASK_STATUS)[keyof typeof TASK_STATUS] | string,
  ) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Get predecessor task IDs from task data
  const predecessorTaskIds = useMemo(() => {
    if (task.predecessorTask?.id) {
      return [task.predecessorTask.id];
    }
    if (task.predecessorTaskId) {
      return [task.predecessorTaskId];
    }
    // Check if API returns predecessorTasks array
    const predecessorTasks = (task as any)?.predecessorTasks;
    if (Array.isArray(predecessorTasks) && predecessorTasks.length > 0) {
      return predecessorTasks
        .map((t: any) => t?.id)
        .filter((id: any): id is string => typeof id === 'string');
    }
    return [];
  }, [task]);

  // Fetch predecessor tasks to check their completion status
  const predecessorTask1 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[0] || '' },
    { skip: !predecessorTaskIds[0] },
  );
  const predecessorTask2 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[1] || '' },
    { skip: !predecessorTaskIds[1] },
  );
  const predecessorTask3 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[2] || '' },
    { skip: !predecessorTaskIds[2] },
  );
  const predecessorTask4 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[3] || '' },
    { skip: !predecessorTaskIds[3] },
  );
  const predecessorTask5 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[4] || '' },
    { skip: !predecessorTaskIds[4] },
  );

  const predecessorTasks = useMemo(() => {
    return [
      predecessorTask1.data,
      predecessorTask2.data,
      predecessorTask3.data,
      predecessorTask4.data,
      predecessorTask5.data,
    ].filter((t): t is NonNullable<typeof t> => t !== undefined);
  }, [
    predecessorTask1.data,
    predecessorTask2.data,
    predecessorTask3.data,
    predecessorTask4.data,
    predecessorTask5.data,
  ]);

  // Check if any predecessor is incomplete
  const hasIncompletePredecessors = useMemo(() => {
    if (predecessorTaskIds.length === 0) return false;
    if (predecessorTasks.length === 0) return true; // If we can't fetch, assume incomplete

    return predecessorTasks.some((t) => {
      const status = (t.taskStatus || t.status || '').toUpperCase();
      return status !== 'COMPLETED';
    });
  }, [predecessorTaskIds.length, predecessorTasks]);

  const hasPredecessors = predecessorTaskIds.length > 0;
  const currentStatus = task.taskStatus || task.status || '';
  const normalizedStatus = currentStatus.toUpperCase();
  const isApproved = isTaskApproved(task);

  // Determine if status should be locked
  const isStatusLocked = hasPredecessors && hasIncompletePredecessors;
  const shouldBeBlocked = isStatusLocked && normalizedStatus !== TASK_STATUS.BLOCKED;

  // Auto-update status to BLOCKED if needed (industry-standard behavior)
  useEffect(() => {
    if (isApproved) return;
    if (shouldBeBlocked && onStatusUpdate && task.id && !isUpdating) {
      // Automatically set to BLOCKED
      setIsUpdating(true);
      onStatusUpdate(task.id, TASK_STATUS.BLOCKED)
        .catch(() => {
          // Silently fail - will retry on next render if needed
        })
        .finally(() => {
          setIsUpdating(false);
        });
    }
  }, [shouldBeBlocked, onStatusUpdate, task.id, isUpdating, isApproved]);

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus || !task.id) return;

    // Validate: Don't allow status change if predecessors are incomplete
    if (hasPredecessors && hasIncompletePredecessors && newStatus !== TASK_STATUS.BLOCKED) {
      toast.error('Cannot change status. All predecessor tasks must be completed first.');
      return;
    }

    // If trying to change from BLOCKED but predecessors are still incomplete, prevent it
    if (
      normalizedStatus === TASK_STATUS.BLOCKED &&
      hasIncompletePredecessors &&
      newStatus !== TASK_STATUS.BLOCKED
    ) {
      toast.error(
        'Task is blocked by incomplete predecessors. Complete all predecessor tasks first.',
      );
      return;
    }

    setIsUpdating(true);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(task.id, newStatus);
      }
    } catch (error) {
      const err = error as { data?: TErrorResponse };
      toast.error(err?.data?.message || 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Show StatusBadge if status is locked and should be blocked (read-only)
  if (shouldBeBlocked) {
    return <StatusBadge status={TASK_STATUS.BLOCKED} />;
  }

  if (isApproved) {
    return <StatusBadge status='APPROVED' />;
  }

  return (
    <FormSelect
      value={normalizedStatus || ''}
      onChange={handleStatusChange}
      options={TASK_STATUS_OPTIONS}
      disabled={isUpdating || isStatusLocked}
      placeholder='Select Status'
      className='min-w-[120px]'
      inputClassName='!py-2 !text-sm'
      clearable={!isStatusLocked}
    />
  );
}

export default function ProjectTasksTable({
  tasks,
  totalCount,
}: {
  tasks: TTask[];
  totalCount?: number;
}) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<TTask | null>(null);
  const [isOpenEditTaskSidebar, { open: openEditTaskSidebar, close: closeEditTaskSidebar }] =
    useDisclosure();
  const [isOpenDeleteTaskModal, { open: openDeleteTaskModal, close: closeDeleteTaskModal }] =
    useDisclosure();
  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [markTaskComplete, { isLoading: isMarkingComplete }] = useMarkTaskCompleteMutation();
  const [editTask] = useEditTaskMutation();
  const { setParams, getParam } = useUrlSearchParams();

  const taskIdFromUrl = getParam('taskId');

  // Sync URL taskId to sidebar: when taskId is in URL, open sidebar so EditTaskSidebar can fetch by id (works even if task is not on current page)
  useEffect(() => {
    if (!taskIdFromUrl) return;
    if (selectedTask?.id === taskIdFromUrl) return;
    setSelectedTask({ id: taskIdFromUrl } as TTask);
    openEditTaskSidebar();
  }, [taskIdFromUrl]);

  // Handler for inline status updates with predecessor validation
  const handleStatusUpdate = async (
    taskId: string,
    newStatus: (typeof TASK_STATUS)[keyof typeof TASK_STATUS] | string,
  ) => {
    if (!editTask || !taskId) {
      throw new Error('Invalid task or edit function');
    }

    return editTask({
      id: taskId,
      taskStatus: newStatus as (typeof TASK_STATUS)[keyof typeof TASK_STATUS],
    } as Parameters<typeof editTask>[0])
      .unwrap()
      .then(() => {
        toast.success('Task status updated successfully');
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          throw new Error(error.data.message);
        }
        throw new Error('Failed to update task status');
      });
  };

  // Handle master checkbox
  // const handleMasterCheck = (checked: boolean) => {
  //   setAllChecked(checked);
  //   setCheckedRows(checked ? tasks.map((_, i) => i) : []);
  // };
  // // Handle per-row checkbox
  // const handleRowCheck = (rowIdx: number, checked: boolean) => {
  //   setCheckedRows((prev) => (checked ? [...prev, rowIdx] : prev.filter((i) => i !== rowIdx)));
  // };

  function handleEdit(task: TTask | null) {
    setSelectedTask(task);
    openEditTaskSidebar();
    if (task?.id) setParams('taskId', task?.id);
  }
  function handleDeleteTask() {
    if (!selectedTask?.id) return;
    deleteTask({ id: selectedTask.id })
      .unwrap()
      .then(() => {
        toast.success('Task deleted successfully');
        closeDeleteTaskModal();
        setSelectedTask(null);
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

  function handleMarkComplete(task: TTask, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    const isCompleted = isTaskCompleted(task?.status, task?.taskStatus);
    markTaskComplete({ id: task?.id })
      .unwrap()
      .then(() => {
        toast.success(isCompleted ? 'Task marked as incomplete' : 'Task marked as complete');
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error(
            isCompleted ? 'Unable to mark task as incomplete' : 'Unable to mark task as complete',
          );
        }
        console.error('Error toggling task completion:', error);
      });
  }

  return (
    <>
      <TableWrapper totalCount={totalCount}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className='w-8'>
              <CustomCheckbox
                checked={selectedRows.length === tasks?.length}
                onChange={(event) =>
                  setSelectedRows(event.target.checked ? tasks?.map((q) => q.id) || [] : [])
                }
              />
            </Table.Th>
            <Table.Th>Task ID</Table.Th>
            <Table.Th>Task Name</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th>Planned Start</Table.Th>
            <Table.Th>Planned End</Table.Th>
            <Table.Th>Assigned To</Table.Th>
            <Table.Th>Assigned By</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Progress</Table.Th>
            <Table.Th>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tasks.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={11} className='text-center text-sm text-text-subHeading py-8'>
                No tasks found
              </Table.Td>
            </Table.Tr>
          ) : (
            tasks?.map((task, idx) => (
              <Table.Tr
                key={idx}
                onClick={() => handleEdit(task)}
                className='cursor-pointer transition-colors duration-100 active:bg-gray-100'
              >
                <Table.Td>
                  <CustomCheckbox
                    checked={selectedRows.includes(task?.id)}
                    onChange={(event) =>
                      setSelectedRows((prev) =>
                        event.target.checked
                          ? [...prev, task?.id]
                          : prev.filter((row) => row !== task?.id),
                      )
                    }
                  />
                </Table.Td>
                <Table.Td>{task?.sNo}</Table.Td>
                <TableData>
                  <div className='flex flex-col'>
                    <span>{task?.name}</span>
                    {isTaskApproved(task) && (
                      <span className='text-xs text-emerald-700'>
                        Approved by {task?.approvedByUser?.name || '—'}
                      </span>
                    )}
                  </div>
                </TableData>
                <TableData>
                  {calculateDuration(task?.plannedStart, task?.plannedEnd) + ' days'}
                </TableData>
                <TableData>
                  {task?.plannedStart && format(task?.plannedStart, 'dd-MMM-yyyy')}
                </TableData>
                <TableData>{task?.plannedEnd && format(task?.plannedEnd, 'dd-MMM-yyyy')}</TableData>
                <TableData>{getTaskAssigneeNames(task)}</TableData>
                <TableData>{task?.assignedByUser?.name}</TableData>
                <Table.Td className='text-right' onClick={(e) => e.stopPropagation()}>
                  <InlineStatusEditor task={task} onStatusUpdate={handleStatusUpdate} />
                </Table.Td>
                <Table.Td className='text-right'>
                  <ProgressCircle progress={task?.progress} />
                </Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <div className='flex items-center space-x-2'>
                    <ActionButton
                      tooltip={
                        isTaskCompleted(task?.status, task?.taskStatus)
                          ? 'Mark as Incomplete'
                          : 'Mark as Complete'
                      }
                      icon={
                        isTaskCompleted(task?.status, task?.taskStatus) ? (
                          <IconCircleCheck className='size-4 fill-green-700 text-green-100' />
                        ) : (
                          <IconCheck className='size-4' />
                        )
                      }
                      onClick={() => handleMarkComplete(task)}
                      disabled={isMarkingComplete || isTaskApproved(task)}
                    />
                    {!isTaskApproved(task) && (
                      <>
                        <EditButton tooltip='Edit Task' onEdit={() => handleEdit(task)} />
                        <DeleteButton
                          tooltip='Delete Task'
                          onDelete={() => {
                            setSelectedTask(task);
                            openDeleteTaskModal();
                          }}
                        />
                      </>
                    )}
                  </div>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </TableWrapper>

      <EditTaskSidebar
        isOpen={isOpenEditTaskSidebar}
        onClose={closeEditTaskSidebar}
        task={selectedTask}
      />
      <AlertModal
        title={`Delete ${selectedTask?.name} ?`}
        onClose={closeDeleteTaskModal}
        onConfirm={handleDeleteTask}
        opened={isOpenDeleteTaskModal}
        isLoading={isDeletingTask}
      />
    </>
  );
}
