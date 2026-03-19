import { format } from 'date-fns';
import { IconCircleCheck, IconCheck, IconGripVertical } from '@tabler/icons-react';
import { Table } from '@mantine/core';
import { ActionButton, EditButton, DeleteButton } from '../../../../../components';
import StatusBadge from '../../../../../components/common/StatusBadge';
import ProgressCircle from '../../../../../components/common/ProgressCircle';
import FormSelect from '../../../../../components/base/FormSelect';
import {
  getTaskAssigneeNames,
  isTaskApproved,
  isTaskCompleted,
  formatAssigneeNames,
} from '../../../../../utils/helper';
import type { TPhaseTask, TPhase } from '../../../../../store/types/phase.types';
import { TASK_STATUS_OPTIONS, TASK_STATUS } from '../../../../../constants/ui';
import { useGetTaskByIdQuery } from '../../../../../store/services/task/taskSlice';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../../store/types/common.types';

type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  task: TPhaseTask;
  phase: TPhase;
};

interface TaskListItemProps {
  card: KanbanCard;
  onEdit: () => void;
  onDelete: () => void;
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
  dragHandleProps?: any;
  onStatusUpdate?: (taskId: string, newStatus: string) => Promise<void>;
}

// Component to handle inline status editing with predecessor validation
function InlineStatusEditor({
  task,
  onStatusUpdate,
}: {
  task: TPhaseTask;
  onStatusUpdate?: (taskId: string, newStatus: string) => Promise<void>;
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
  const isApproved = isTaskApproved(task as any);

  // Determine if status should be locked
  const isStatusLocked = hasPredecessors && hasIncompletePredecessors;

  // Auto-set to BLOCKED if predecessors are incomplete and status is not already BLOCKED
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

export function TaskListItem({
  card,
  onEdit,
  onDelete,
  onMarkComplete,
  isMarkingComplete,
  dragHandleProps,
  onStatusUpdate,
}: TaskListItemProps) {
  const { task } = card;
  const assigneeNames = getTaskAssigneeNames(task);
  const hasDuration = task.duration != null;
  const approved = isTaskApproved(task as any);

  return (
    <>
      <Table.Td onClick={(e) => e.stopPropagation()} className='w-12 text-center py-3'>
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className='cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 inline-flex'
          >
            <IconGripVertical className='size-4' />
          </div>
        )}
      </Table.Td>

      <Table.Td className='w-16 py-3'>
        <span className='text-sm font-medium text-gray-600'>{task.sNo || '—'}</span>
      </Table.Td>

      <Table.Td className='min-w-[200px] py-3'>
        <div className='flex flex-col'>
          <span className='text-sm font-medium text-gray-900'>{task.name}</span>
          {approved && (
            <span className='text-xs text-emerald-700'>
              Approved by {(task as any)?.approvedByUser?.name || '—'}
            </span>
          )}
        </div>
      </Table.Td>

      <Table.Td className='w-28 py-3'>
        {hasDuration ? (
          <span className='text-sm text-gray-600'>
            {task.duration} {task.unit || 'days'}
          </span>
        ) : (
          <span className='text-sm text-gray-400'>—</span>
        )}
      </Table.Td>

      <Table.Td className='w-36 py-3 whitespace-nowrap'>
        {task.plannedStart ? (
          format(new Date(task.plannedStart), 'dd MMM yyyy')
        ) : (
          <span className='text-gray-400'>—</span>
        )}
      </Table.Td>

      <Table.Td className='w-36 py-3 whitespace-nowrap'>
        {task.plannedEnd ? (
          format(new Date(task.plannedEnd), 'dd MMM yyyy')
        ) : (
          <span className='text-gray-400'>—</span>
        )}
      </Table.Td>

      <Table.Td className='min-w-[150px] py-3'>
        {assigneeNames && assigneeNames !== '—' ? (
          <span
            className='text-sm text-gray-700 line-clamp-1'
            title={formatAssigneeNames(assigneeNames)}
          >
            {formatAssigneeNames(assigneeNames)}
          </span>
        ) : (
          <span className='text-gray-400'>—</span>
        )}
      </Table.Td>

      <Table.Td className='min-w-[120px] py-3'>
        {task.assignedByUser?.name || <span className='text-gray-400'>—</span>}
      </Table.Td>

      <Table.Td className='w-28 text-center py-3' onClick={(e) => e.stopPropagation()}>
        <InlineStatusEditor task={task} onStatusUpdate={onStatusUpdate} />
      </Table.Td>

      <Table.Td className='w-32 text-center py-3'>
        <ProgressCircle progress={task.progress} />
      </Table.Td>

      <Table.Td onClick={(e) => e.stopPropagation()} className='w-36 py-3'>
        <div className='flex items-center justify-center gap-1.5'>
          {onMarkComplete && (
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
              onClick={onMarkComplete}
              disabled={isMarkingComplete || approved}
            />
          )}
          {!approved && <EditButton tooltip='Edit Task' onEdit={onEdit} />}
          {!approved && <DeleteButton tooltip='Delete Task' onDelete={onDelete} />}
        </div>
      </Table.Td>
    </>
  );
}
