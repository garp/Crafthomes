import { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { IconGripVertical, IconCircleCheck, IconUser, IconCalendar } from '@tabler/icons-react';
import { EditButton, DeleteButton, ActionButton } from '../../../../../components';
import {
  getTaskAssigneeNames,
  isTaskCompleted,
  formatAssigneeNames,
  sanitizeHTML,
} from '../../../../../utils/helper';
import type { TPhaseTask, TPhase } from '../../../../../store/types/phase.types';

type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  task: TPhaseTask;
  phase: TPhase;
};

interface TaskCardItemProps {
  card: KanbanCard;
  onEdit: () => void;
  onDelete: () => void;
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
  dragHandleProps?: any;
  isEditing?: boolean;
  editingValue?: string;
  onEditStart?: () => void;
  onEditChange?: (value: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
}

export function TaskCardItem({
  card,
  onEdit,
  onDelete,
  onMarkComplete,
  isMarkingComplete,
  dragHandleProps,
  isEditing,
  editingValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
}: TaskCardItemProps) {
  const { task } = card;
  const assigneeNames = getTaskAssigneeNames(task);
  const hasDelayedBy = task.delayedBy && task.delayedBy > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEditSave?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onEditCancel?.();
    }
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow select-none task-card'>
      <div className='flex items-start justify-between mb-2 gap-2'>
        <div className='flex items-start gap-2 flex-1 min-w-0'>
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className='cursor-grab active:cursor-grabbing mt-0.5 shrink-0'
              onClick={(e) => e.stopPropagation()}
            >
              <IconGripVertical className='size-4 text-gray-400' />
            </div>
          )}
          {isEditing ? (
            <input
              ref={inputRef}
              type='text'
              value={editingValue || ''}
              onChange={(e) => onEditChange?.(e.target.value)}
              onBlur={onEditSave}
              onKeyDown={handleKeyDown}
              className='font-semibold text-sm text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-400'
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className='font-semibold text-sm text-gray-900 flex-1 line-clamp-2 cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded transition-colors'
              onClick={(e) => {
                e.stopPropagation();
                onEditStart?.();
              }}
              title='Click to edit task name'
            >
              {task.name}
            </h3>
          )}
        </div>
        <div className='flex gap-1 shrink-0' onClick={(e) => e.stopPropagation()}>
          {onMarkComplete && (
            <ActionButton
              icon={
                !isTaskCompleted(card.task?.status, card.task?.taskStatus) ? (
                  <IconCircleCheck className='size-4 text-gray-600' />
                ) : (
                  <IconCircleCheck className='size-4 text-green-600' />
                )
              }
              tooltip={
                isTaskCompleted(card.task?.status, card.task?.taskStatus)
                  ? 'Mark as Incomplete'
                  : 'Mark as Complete'
              }
              onClick={onMarkComplete}
              disabled={isMarkingComplete}
              className={
                isTaskCompleted(card.task?.status, card.task?.taskStatus)
                  ? 'hover:text-gray-800'
                  : 'hover:text-green-700'
              }
            />
          )}
          <EditButton onEdit={onEdit} />
          <DeleteButton onDelete={onDelete} />
        </div>
      </div>

      {task.description && (
        <div
          className='text-xs text-gray-600 mb-2 line-clamp-2'
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(task.description) }}
        />
      )}

      <div className='space-y-1.5 text-xs text-gray-600'>
        {task.duration != null && (
          <div className='flex items-center gap-1'>
            <span className='font-medium'>Duration:</span>
            <span>
              {task.duration} {task.unit || 'days'}
            </span>
          </div>
        )}

        {task.plannedStart && (
          <div className='flex items-center gap-1'>
            <IconCalendar className='size-3 text-gray-400' />
            <span className='font-medium'>Start:</span>
            <span>{format(new Date(task.plannedStart), 'dd MMM yyyy')}</span>
          </div>
        )}

        {task.plannedEnd && (
          <div className='flex items-center gap-1'>
            <IconCalendar className='size-3 text-gray-400' />
            <span className='font-medium'>End:</span>
            <span>{format(new Date(task.plannedEnd), 'dd MMM yyyy')}</span>
          </div>
        )}

        {task.predecessorTask?.name && (
          <div className='flex items-center gap-1'>
            <span className='font-medium'>Predecessor:</span>
            <span className='truncate'>{task.predecessorTask.name}</span>
          </div>
        )}

        {assigneeNames && assigneeNames !== '—' && (
          <div className='flex items-center gap-1'>
            <IconUser className='size-3 text-gray-400' />
            <span className='font-medium'>Assigned To:</span>
            <span className='truncate'>{formatAssigneeNames(assigneeNames)}</span>
          </div>
        )}

        {task.assignedByUser?.name && (
          <div className='flex items-center gap-1'>
            <span className='font-medium'>Assigned By:</span>
            <span className='truncate'>{task.assignedByUser.name}</span>
          </div>
        )}

        {hasDelayedBy && (
          <div className='flex items-center gap-1 text-orange-600 font-medium'>
            <span>Delayed by:</span>
            <span>{task.delayedBy} days</span>
          </div>
        )}
      </div>
    </div>
  );
}
