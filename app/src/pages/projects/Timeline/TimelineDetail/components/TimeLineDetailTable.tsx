import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { useDisclosure } from '@mantine/hooks';
import { Menu } from '@mantine/core';
import {
  IconPlus,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconArrowLeft,
  IconArrowRight,
  IconCircleCheck,
  IconUser,
  IconCalendar,
  IconGripHorizontal,
} from '@tabler/icons-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '../../../../../components';
import AddProjectPhaseSidebar from './AddProjectPhaseSidebar';
import { isTaskCompleted } from '../../../../../utils/helper';
import { ListView } from './ListView';
import { TaskCardItem } from './TaskCardItem';
import EditProjectTaskSidebar from '../../../../../components/common/Task/EditTaskSidebar';
import AlertModal from '../../../../../components/base/AlertModal';
import IconButton from '../../../../../components/base/button/IconButton';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../../store/types/common.types';
import { AddTaskSidebar } from '../../../../../components/common/Task/AddTaskSidebar';
import {
  useGetPhasesQuery,
  useEditPhaseMutation,
  useDeletePhaseMutation,
  useRearrangePhasesMutation,
  useRearrangeTasksMutation,
} from '../../../../../store/services/phase/phaseSlice';
import {
  useGetTimelineByIdQuery,
  timelineApi,
} from '../../../../../store/services/projectTimeline/projectTimelineSlice';
import type { TPhase, TPhaseTask } from '../../../../../store/types/phase.types';
import type { TTask } from '../../../../../store/types/task.types';
import {
  useDeleteTaskMutation,
  useEditTaskMutation,
  useCreateTaskMutation,
  useMarkTaskCompleteMutation,
} from '../../../../../store/services/task/taskSlice';
import { TaskAssigneeCombobox } from '../../../../../components/common/selectors/UserSelector';
import FormDate from '../../../../../components/base/FormDate';
import { getUser } from '../../../../../utils/auth';
import useUrlSearchParams from '../../../../../hooks/useUrlSearchParams';
import StatusSelector from '../../../../../components/common/selectors/StatusSelector';
import { statusOptions } from '../../../../tasks/constants/constants';

// Kanban board types
type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  task: TPhaseTask;
  phase: TPhase;
};

type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
  phase: TPhase;
};

// Transform phases to kanban board format
function transformPhasesToKanban(phases: TPhase[]): KanbanColumn[] {
  return phases
    .filter((phase) => phase && phase.id)
    .map((phase) => {
      // Handle both 'tasks' and 'Task' property names
      const tasks = (phase.tasks || phase.Task || []) as TPhaseTask[];

      // Sort tasks by sNo to maintain order and filter out invalid tasks
      const sortedTasks = [...tasks]
        .filter((task) => task && task.id)
        .sort((a, b) => (a.sNo || 0) - (b.sNo || 0));

      const cards: KanbanCard[] = sortedTasks
        .filter((task) => task && task.id)
        .map((task) => ({
          id: task.id,
          title: task.name || '',
          description: task.description || '',
          task,
          phase,
        }));

      return {
        id: phase.id,
        title: phase.name || '',
        cards,
        phase,
      };
    })
    .filter((col) => col && col.id);
}

// Draggable Card Component
function DraggableTaskCard({
  card,
  onEdit,
  onDelete,
  onMarkComplete,
  isMarkingComplete,
  isEditing,
  editingValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
}: {
  card: KanbanCard;
  onEdit: () => void;
  onDelete: () => void;
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
  isEditing?: boolean;
  editingValue?: string;
  onEditStart?: () => void;
  onEditChange?: (value: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: 'task',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Create drag handle props - only the grip icon will trigger drag
  const dragHandleProps = {
    ...attributes,
    ...listeners,
    style: { touchAction: 'none', cursor: 'grab' } as React.CSSProperties,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardItem
        card={card}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkComplete={onMarkComplete}
        isMarkingComplete={isMarkingComplete}
        dragHandleProps={dragHandleProps}
        isEditing={isEditing}
        editingValue={editingValue}
        onEditStart={onEditStart}
        onEditChange={onEditChange}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
      />
    </div>
  );
}

// Custom Column Header Component
function ColumnHeader({
  column,
  isEditing,
  editingValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onAddTask,
  onMoveLeft,
  onMoveRight,
  onRename,
  onDelete,
  canMoveLeft,
  canMoveRight,
  dragHandleProps,
}: {
  column: KanbanColumn;
  isEditing: boolean;
  editingValue: string;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onAddTask: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRename: () => void;
  onDelete: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  dragHandleProps?: any;
}) {
  const taskCount = column.cards.length;
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuOpened, setMenuOpened] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onEditSave();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  return (
    <div
      className='flex items-center justify-between mb-3 p-2 bg-orange-50 rounded-lg sticky top-0 z-20 select-none'
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onPointerDown={(e) => {
        // Prevent drag when clicking on interactive elements in header
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('input') ||
          target.closest('[role="menu"]') ||
          target.closest('[role="menuitem"]')
        ) {
          e.stopPropagation();
          return;
        }
        // Prevent text selection
        if (window.getSelection && !target.closest('input')) {
          window.getSelection()?.removeAllRanges();
        }
      }}
      onMouseDown={(e) => {
        // Prevent text selection on mouse down
        const target = e.target as HTMLElement;
        if (!target.closest('input')) {
          if (window.getSelection) {
            window.getSelection()?.removeAllRanges();
          }
        }
      }}
    >
      <div className='flex items-center gap-2 flex-1 min-w-0'>
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className='cursor-grab active:cursor-grabbing text-orange-400 hover:text-orange-500 shrink-0 touch-none select-none'
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            data-drag-handle
          >
            <IconGripHorizontal className='size-4' />
          </div>
        )}
        {isEditing ? (
          <input
            ref={inputRef}
            type='text'
            value={editingValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onEditSave}
            onKeyDown={handleKeyDown}
            className='text-orange-400 font-semibold text-sm bg-white border border-orange-300 rounded px-2 h-5 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-orange-400 leading-tight'
            style={{ lineHeight: '1.25rem' }}
          />
        ) : (
          <h2
            className='text-orange-400 font-semibold text-sm truncate cursor-pointer hover:underline flex-1 h-5 leading-tight'
            style={{ lineHeight: '1.25rem', userSelect: 'text' }}
            onClick={(e) => {
              e.stopPropagation();
              onEditStart();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            {column.title}
          </h2>
        )}
        <span className='bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-full shrink-0'>
          {taskCount}
        </span>
      </div>
      <div className='flex items-center gap-1 shrink-0 ml-2'>
        <IconButton onClick={onAddTask} className='hover:bg-orange-100 rounded p-1'>
          <IconPlus className='size-4 text-orange-400' />
        </IconButton>
        <Menu opened={menuOpened} onChange={setMenuOpened} position='bottom-end'>
          <Menu.Target>
            <IconButton className='hover:bg-orange-100 rounded p-1'>
              <IconDotsVertical className='size-4 text-orange-400' />
            </IconButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconArrowLeft className='size-4' />}
              disabled={!canMoveLeft}
              onClick={onMoveLeft}
            >
              Move left
            </Menu.Item>
            <Menu.Item
              leftSection={<IconArrowRight className='size-4' />}
              disabled={!canMoveRight}
              onClick={onMoveRight}
            >
              Move right
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPencil className='size-4' />}
              onClick={() => {
                onRename();
                setMenuOpened(false);
              }}
            >
              Rename section
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash className='size-4' />}
              color='red'
              onClick={() => {
                onDelete();
                setMenuOpened(false);
              }}
            >
              Delete section
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}

// Quick Add Task Form Component
function QuickAddTaskForm({
  phase,
  projectId,
  onSuccess,
  onTaskCreated,
}: {
  phase: TPhase;
  projectId: string;
  onSuccess: () => void;
  onTaskCreated?: (task: TTask) => void;
}) {
  const [taskName, setTaskName] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const currentUser = getUser();
  const assigneeRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);
  const endDatePickerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if click is inside assignee dropdown or its button
      const isInsideAssignee =
        assigneeRef.current?.contains(target) || assigneeDropdownRef.current?.contains(target);

      // Check if click is inside date pickers or their buttons
      const isInsideDatePicker =
        dateRef.current?.contains(target) || datePickerRef.current?.contains(target);
      const isInsideEndDatePicker =
        endDateRef.current?.contains(target) || endDatePickerRef.current?.contains(target);

      // Close assignee dropdown if clicked outside
      if (!isInsideAssignee) {
        setShowAssigneeDropdown(false);
      }

      // Close date pickers if clicked outside
      if (!isInsideDatePicker) {
        setShowDatePicker(false);
      }
      if (!isInsideEndDatePicker) {
        setShowEndDatePicker(false);
      }

      // Close the entire form if clicked outside (but not if clicking on dropdowns)
      if (
        formRef.current &&
        !formRef.current.contains(target) &&
        !isInsideAssignee &&
        !isInsideDatePicker &&
        !isInsideEndDatePicker
      ) {
        // Close if form is empty, otherwise user can press Escape to close
        if (!taskName.trim() && assignees.length === 0 && !startDate && !endDate) {
          onSuccess();
        }
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Close dropdowns first
        if (showAssigneeDropdown) {
          setShowAssigneeDropdown(false);
          return;
        }
        if (showDatePicker) {
          setShowDatePicker(false);
          return;
        }
        if (showEndDatePicker) {
          setShowEndDatePicker(false);
          return;
        }
        // Reset form and close if no dropdowns are open
        setTaskName('');
        setAssignees([]);
        setStartDate(null);
        setEndDate(null);
        setShowAssigneeDropdown(false);
        setShowDatePicker(false);
        setShowEndDatePicker(false);
        onSuccess();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [
    taskName,
    assignees,
    startDate,
    endDate,
    onSuccess,
    showAssigneeDropdown,
    showDatePicker,
    showEndDatePicker,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent double submission
    if (isCreatingTask) {
      return;
    }

    if (!taskName.trim()) {
      toast.error('Task name is required');
      return;
    }

    if (!phase || !phase.id) {
      toast.error('Invalid phase');
      return;
    }

    if (!projectId) {
      toast.error('Project is required');
      return;
    }

    const payload: any = {
      name: taskName.trim(),
      phaseId: phase.id,
      projectId,
      assignedBy: currentUser?.id || '',
    };

    if (assignees.length > 0) {
      payload.assignee = assignees;
    }

    if (startDate) {
      payload.plannedStart = startDate instanceof Date ? startDate.toISOString() : startDate;
    }
    if (endDate) {
      payload.plannedEnd = endDate instanceof Date ? endDate.toISOString() : endDate;
    }

    createTask(payload)
      .unwrap()
      .then((result: { data?: TTask } | TTask) => {
        const task =
          result && typeof (result as any).data !== 'undefined'
            ? (result as { data: TTask }).data
            : (result as TTask);
        if (task) onTaskCreated?.(task);
        toast.success('Task created successfully');
        // Reset form state
        setTaskName('');
        setAssignees([]);
        setStartDate(null);
        setEndDate(null);
        setShowAssigneeDropdown(false);
        setShowDatePicker(false);
        setShowEndDatePicker(false);
        // Close the form
        onSuccess();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Unable to create Task');
        }
        console.error('Error creating task:', error);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      // Only submit if not already creating
      if (!isCreatingTask && taskName.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className='space-y-3'
      onKeyDown={(e) => {
        // Prevent form submission on Enter if dropdowns are open
        if (e.key === 'Enter' && (showAssigneeDropdown || showDatePicker || showEndDatePicker)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className='bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm'>
        {/* Task Name Input */}
        <div className='flex items-center gap-3 px-1'>
          <div className='flex items-center justify-center size-5 rounded-full border-2 border-gray-300 shrink-0'>
            <IconCircleCheck className='size-3 text-gray-400' />
          </div>
          <input
            type='text'
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Write a task name'
            className='flex-1 text-sm font-medium bg-transparent border-none outline-none placeholder:text-gray-400 text-gray-900'
            autoFocus
            disabled={isCreatingTask}
          />
        </div>

        {/* Assigned To and Start Date */}
        <div className='flex items-start gap-2'>
          <div className='flex-1 relative' ref={assigneeRef}>
            <button
              type='button'
              onClick={() => {
                setShowAssigneeDropdown(!showAssigneeDropdown);
                if (!showAssigneeDropdown) {
                  setShowDatePicker(false);
                  setShowEndDatePicker(false);
                }
              }}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[36px] font-medium text-sm ${
                assignees.length > 0
                  ? 'border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-500 shadow-sm'
                  : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <IconUser
                className={`size-4 ${assignees.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}
              />
              {assignees.length > 0 ? (
                <span className='text-xs font-semibold'>{assignees.length} selected</span>
              ) : (
                <span className='text-xs'>Assign</span>
              )}
            </button>
            {showAssigneeDropdown && (
              <div
                ref={assigneeDropdownRef}
                className='absolute bottom-full left-0 right-0 mb-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3 max-h-64 overflow-y-auto min-w-[280px]'
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <TaskAssigneeCombobox
                  value={assignees}
                  setValue={(ids) => {
                    setAssignees(ids);
                    // Don't auto-close, let user select multiple
                  }}
                  projectId={projectId}
                  className='w-full'
                />
              </div>
            )}
          </div>
          <div className='flex-1 relative' ref={dateRef}>
            <button
              type='button'
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                if (!showDatePicker) {
                  setShowAssigneeDropdown(false);
                  setShowEndDatePicker(false);
                }
              }}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[36px] font-medium text-sm ${
                startDate
                  ? 'border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-500 shadow-sm'
                  : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <IconCalendar className={`size-4 ${startDate ? 'text-blue-600' : 'text-gray-500'}`} />
              {startDate ? (
                <span className='text-xs font-semibold'>{format(startDate, 'MMM dd')}</span>
              ) : (
                <span className='text-xs'>Start date</span>
              )}
            </button>
            {showDatePicker && (
              <div
                ref={datePickerRef}
                className='absolute bottom-full left-0 right-0 mb-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[280px]'
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <FormDate
                  value={startDate}
                  onChange={(date: Date | string | null) => {
                    let dateValue: Date | null = null;
                    if (date) {
                      if (date instanceof Date) {
                        dateValue = date;
                      } else if (typeof date === 'string') {
                        dateValue = new Date(date);
                      }
                    }
                    setStartDate(dateValue);
                    if (dateValue) {
                      setShowDatePicker(false);
                    }
                  }}
                  placeholder='Start date'
                  className='w-full'
                  inputClassName='!py-2 text-xs'
                />
              </div>
            )}
          </div>
          <div className='flex-1 relative' ref={endDateRef}>
            <button
              type='button'
              onClick={() => {
                setShowEndDatePicker(!showEndDatePicker);
                if (!showEndDatePicker) {
                  setShowAssigneeDropdown(false);
                  setShowDatePicker(false);
                }
              }}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[36px] font-medium text-sm ${
                endDate
                  ? 'border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-500 shadow-sm'
                  : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <IconCalendar className={`size-4 ${endDate ? 'text-blue-600' : 'text-gray-500'}`} />
              {endDate ? (
                <span className='text-xs font-semibold'>{format(endDate, 'MMM dd')}</span>
              ) : (
                <span className='text-xs'>End date</span>
              )}
            </button>
            {showEndDatePicker && (
              <div
                ref={endDatePickerRef}
                className='absolute bottom-full left-0 right-0 mb-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[280px]'
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <FormDate
                  value={endDate}
                  onChange={(date: Date | string | null) => {
                    let dateValue: Date | null = null;
                    if (date) {
                      if (date instanceof Date) {
                        dateValue = date;
                      } else if (typeof date === 'string') {
                        dateValue = new Date(date);
                      }
                    }
                    setEndDate(dateValue);
                    if (dateValue) {
                      setShowEndDatePicker(false);
                    }
                  }}
                  placeholder='End date'
                  className='w-full'
                  inputClassName='!py-2 text-xs'
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type='submit'
        disabled={isCreatingTask || !taskName.trim()}
        radius='full'
        size='sm'
        className='text-blue-400! bg-blue-100 hover:bg-blue-200! px-3 py-1 text-xs whitespace-nowrap w-full disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isCreatingTask ? 'Creating...' : '+ Add task'}
      </Button>
    </form>
  );
}

// Draggable Kanban Column Component
function DraggableKanbanColumn({
  column,
  onEditTask,
  onDeleteTask,
  onMarkTaskComplete,
  isMarkingComplete,
  onAddTask,
  isEditing,
  editingValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onMoveLeft,
  onMoveRight,
  onRename,
  onDelete,
  canMoveLeft,
  canMoveRight,
  showQuickAddForm,
  projectId,
  onQuickAddSuccess,
  onTaskCreated,
  editingTaskId,
  editingTaskName,
  onTaskNameEditStart,
  onTaskNameEditChange,
  onTaskNameEditSave,
  onTaskNameEditCancel,
}: {
  column: KanbanColumn;
  onEditTask: (card: KanbanCard) => void;
  onDeleteTask: (card: KanbanCard) => void;
  onMarkTaskComplete?: (card: KanbanCard) => void;
  isMarkingComplete?: boolean;
  onAddTask: (phase: TPhase) => void;
  isEditing: boolean;
  editingValue: string;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRename: () => void;
  onDelete: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  showQuickAddForm: boolean;
  projectId: string;
  onQuickAddSuccess: () => void;
  onTaskCreated?: (task: TTask) => void;
  editingTaskId: string | null;
  editingTaskName: string;
  onTaskNameEditStart: (taskId: string) => void;
  onTaskNameEditChange: (value: string) => void;
  onTaskNameEditSave: (taskId: string) => void;
  onTaskNameEditCancel: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const cardIds = column.cards.filter((card) => card && card.id).map((card) => card.id);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const hasTasks = column.cards.length > 0;
  const needsScrolling = column.cards.length > 5; // Changed threshold to 5 tasks

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine refs for both sortable and droppable
  const setRefs = (node: HTMLDivElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  // Create drag handle props for phase column - only the icon will trigger drag
  const phaseDragHandleProps = {
    ...attributes,
    ...listeners,
    style: { touchAction: 'none', cursor: 'grab' } as React.CSSProperties,
  };

  return (
    <div
      ref={setRefs}
      style={{ ...style, userSelect: 'none', WebkitUserSelect: 'none' }}
      className={`bg-gray-50 rounded-lg p-4 min-w-[300px] max-w-[350px] shrink-0 flex flex-col select-none touch-none ${isOver ? 'ring-2 ring-blue-400' : ''} ${needsScrolling ? 'max-h-[calc(100vh-12rem)]' : 'h-auto'}`}
    >
      <ColumnHeader
        column={column}
        isEditing={isEditing}
        editingValue={editingValue}
        onEditStart={onEditStart}
        onEditChange={onEditChange}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
        onAddTask={() => onAddTask(column.phase)}
        onMoveLeft={onMoveLeft}
        onMoveRight={onMoveRight}
        onRename={onRename}
        onDelete={onDelete}
        canMoveLeft={canMoveLeft}
        canMoveRight={canMoveRight}
        dragHandleProps={phaseDragHandleProps}
      />

      {/* Tasks list - only show if there are tasks or if we're not showing quick add at top */}
      {hasTasks && (
        <div
          className={`space-y-3 ${needsScrolling ? 'flex-1 overflow-y-auto min-h-0 mb-3 overflow-x-hidden' : 'mb-3'}`}
          style={needsScrolling ? { maxHeight: 'calc(100vh - 16rem)' } : undefined}
          onPointerDown={(e) => {
            // Prevent phase drag when interacting with tasks
            const target = e.target as HTMLElement;
            if (target.closest('.task-card') || target.closest('[data-drag-handle]')) {
              e.stopPropagation();
            }
          }}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {column.cards.map((card) => {
              const isTaskEditing = editingTaskId === card.id;
              return (
                <div key={card.id} className='task-card'>
                  <DraggableTaskCard
                    card={card}
                    onEdit={() => onEditTask(card)}
                    onDelete={() => onDeleteTask(card)}
                    onMarkComplete={onMarkTaskComplete ? () => onMarkTaskComplete(card) : undefined}
                    isMarkingComplete={isMarkingComplete}
                    isEditing={isTaskEditing}
                    editingValue={editingTaskName}
                    onEditStart={() => onTaskNameEditStart(card.id)}
                    onEditChange={onTaskNameEditChange}
                    onEditSave={() => onTaskNameEditSave(card.id)}
                    onEditCancel={onTaskNameEditCancel}
                  />
                </div>
              );
            })}
          </SortableContext>
        </div>
      )}

      {/* Show create task form at bottom when there are tasks, or show button when no tasks and not in quick add mode */}
      {hasTasks ? (
        showQuickAddForm ? (
          <QuickAddTaskForm
            phase={column.phase}
            projectId={projectId}
            onSuccess={onQuickAddSuccess}
            onTaskCreated={onTaskCreated}
          />
        ) : (
          <Button
            onClick={() => onAddTask(column.phase)}
            radius='full'
            size='sm'
            className='text-blue-400! bg-blue-100 hover:bg-blue-200! px-3 py-1 text-xs whitespace-nowrap w-full'
          >
            + Add task
          </Button>
        )
      ) : (
        !showQuickAddForm && (
          <Button
            onClick={() => onAddTask(column.phase)}
            radius='full'
            size='sm'
            className='text-blue-400! bg-blue-100 hover:bg-blue-200! px-3 py-1 text-xs whitespace-nowrap w-full mt-3'
          >
            + Add task
          </Button>
        )
      )}
    </div>
  );
}

// Add Phase Column Component
function AddPhaseColumn({ onAddPhase }: { onAddPhase: () => void }) {
  return (
    <div className='bg-gray-50 rounded-lg p-4 min-w-[300px] max-w-[350px] shrink-0 flex items-center justify-center'>
      <Button
        onClick={onAddPhase}
        radius='full'
        size='sm'
        className='text-orange-500! bg-orange-100 hover:bg-orange-200 px-5 py-1 text-xs whitespace-nowrap w-full'
      >
        + Add Phase
      </Button>
    </div>
  );
}

type ViewMode = 'card' | 'list';

interface TimelineDetailTableProps {
  viewMode: ViewMode;
}

export default function TimelineDetailTable({ viewMode }: TimelineDetailTableProps) {
  const [selectedPhase, setSelectedPhase] = useState<TPhase | null>(null);
  const [selectedTask, setSelectedTask] = useState<TTask | null>(null);
  const [phases, setPhases] = useState<TPhase[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<string>('');
  const [quickAddPhaseId, setQuickAddPhaseId] = useState<string | null>(null);
  const { timelineId, id: projectId } = useParams();

  // URL params for filtering
  const { getParam, setParams } = useUrlSearchParams();
  const selectedTaskStatus = getParam('status');
  const assignedToMeParam = getParam('assignedToMe');
  const assignedToMe = assignedToMeParam === 'true';
  const currentUser = getUser();

  // Use the new timeline detail API
  const { data: timelineData, refetch: refetchTimeline } = useGetTimelineByIdQuery(
    { id: timelineId || '' },
    { skip: !timelineId },
  );

  const dispatch = useDispatch();

  // Optimistic cache update: add the new task to timeline cache so it appears immediately
  const handleTaskCreated = useCallback(
    (createdTask: TTask | { data: TTask }) => {
      const task =
        createdTask && 'data' in createdTask
          ? (createdTask as { data: TTask }).data
          : (createdTask as TTask);
      if (!task?.id || !task?.phaseId || !timelineId) return;
      dispatch(
        timelineApi.util.updateQueryData('getTimelineById', { id: timelineId }, (draft) => {
          const phaseEntry = draft?.phases?.find((p: any) => p?.phaseDetails?.id === task.phaseId);
          if (!phaseEntry?.phaseDetails) return;
          const normalizedTask = {
            ...task,
            sNo: (phaseEntry.phaseDetails.tasks?.length ?? 0) + 1,
            taskStatus: task.taskStatus ?? task.status ?? 'Pending',
            progress: task.progress ?? 0,
            TaskAssignee: task.TaskAssignee ?? [],
            assignedByUser: task.assignedByUser ?? { id: '', name: '' },
            subTask: task.subTask ?? [],
            comments: task.comments ?? [],
          };
          if (!phaseEntry.phaseDetails.tasks) phaseEntry.phaseDetails.tasks = [];
          phaseEntry.phaseDetails.tasks.push(normalizedTask);
          phaseEntry.phaseDetails.taskCount = (phaseEntry.phaseDetails.taskCount ?? 0) + 1;
          if (draft.stats) {
            draft.stats.totalTasks = (draft.stats.totalTasks ?? 0) + 1;
          }
        }) as never,
      );
    },
    [dispatch, timelineId],
  );

  // Keep the old API as fallback (can be removed later if not needed)
  const { data: phasesData } = useGetPhasesQuery({ timelineId: timelineId || '' });
  const [deleteProjectTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [editTask] = useEditTaskMutation();
  const [editPhase] = useEditPhaseMutation();
  const [deletePhase, { isLoading: isDeletingPhase }] = useDeletePhaseMutation();
  const [rearrangePhases] = useRearrangePhasesMutation();
  const [rearrangeTasks] = useRearrangeTasksMutation();
  const [markTaskComplete, { isLoading: isMarkingComplete }] = useMarkTaskCompleteMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced to 3px for easier dragging
      },
    }),
    useSensor(KeyboardSensor),
  );

  const [isOpenedAddTaskSidebar, { open: openAddTaskSidebar, close: closeAddTaskSidebar }] =
    useDisclosure(false);
  const [isOpenedAddPhaseSidebar, { open: openAddPhaseSidebar, close: closeAddPhaseSidebar }] =
    useDisclosure(false);
  const [isOpenedEditTaskSidebar, { open: openEditTaskSidebar, close: closeEditTaskSidebar }] =
    useDisclosure(false);
  const [isOpenedDeleteTaskModal, { open: openDeleteTaskModal, close: closeDeleteTaskModal }] =
    useDisclosure(false);
  const [isOpenedEditPhaseSidebar, { open: openEditPhaseSidebar, close: closeEditPhaseSidebar }] =
    useDisclosure(false);
  const [isOpenedDeletePhaseModal, { open: openDeletePhaseModal, close: closeDeletePhaseModal }] =
    useDisclosure(false);
  const [phaseToDelete, setPhaseToDelete] = useState<TPhase | null>(null);

  // Update local phases state when data changes
  useEffect(() => {
    if (timelineData?.phases) {
      // Transform the new API response to match the old format
      // Create a copy of the array before sorting to avoid mutating readonly array
      const transformedPhases = [...timelineData.phases]
        .sort((a, b) => a.order - b.order)
        .map((phaseItem) => ({
          ...phaseItem.phaseDetails,
          order: phaseItem.order,
        })) as unknown as TPhase[];
      setPhases(transformedPhases);
    } else if (phasesData?.phases) {
      // Fallback to old API
      setPhases(phasesData.phases);
    }
  }, [timelineData?.phases, phasesData?.phases]);

  // Transform phases to kanban board format whenever phases change
  useEffect(() => {
    if (phases.length > 0) {
      const kanbanColumns = transformPhasesToKanban(phases);
      setColumns(kanbanColumns);
    } else {
      setColumns([]);
    }
  }, [phases]);

  // Filter columns for card view (Kanban) based on status and assignedToMe
  const filteredColumnsForCardView = columns.map((col) => ({
    ...col,
    cards: col.cards.filter((card) => {
      // Filter by status if selected
      if (selectedTaskStatus) {
        const taskStatus = card.task?.taskStatus || card.task?.status || '';
        if (taskStatus !== selectedTaskStatus) return false;
      }
      // Filter by assigned to me if enabled
      if (assignedToMe && currentUser?.id) {
        const assignees = card.task?.TaskAssignee || [];
        const isAssignedToMe = assignees.some((assignee) => assignee?.User?.id === currentUser.id);
        if (!isAssignedToMe) return false;
      }
      return true;
    }),
  }));

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (!active || !active.id) return;

    // Check if dragging a column (phase)
    const column = findColumnById(active.id as string);
    if (column && column.id) {
      setActiveColumn(column);
      setActiveCard(null);
      return;
    }
    // Otherwise, it's a card (task)
    const card = findCardById(active.id as string);
    if (card && card.id && card.task && card.task.id) {
      setActiveCard(card);
      setActiveColumn(null);
    }
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumn(null);

    // Early return if no active or over, or missing IDs
    if (!active || !active.id) return;
    if (!over || !over.id) return;

    // Check if we're dragging a phase column
    const draggedColumn = findColumnById(active.id as string);
    if (draggedColumn && draggedColumn.id) {
      // Handle phase reordering
      // Check if dropped on another column or the column's droppable area
      let overColumn = findColumnById(over.id as string);

      // If dropped on a task card, find its parent column
      if (!overColumn || !overColumn.id) {
        const card = findCardById(over.id as string);
        if (card && card.id) {
          overColumn = findColumnByCardId(over.id as string);
        }
      }

      if (
        !overColumn ||
        !overColumn.id ||
        !draggedColumn.id ||
        draggedColumn.id === overColumn.id
      ) {
        return; // Dropped on same position or invalid
      }

      const sourceIndex = columns.findIndex((col) => col && col.id === draggedColumn.id);
      const destinationIndex = columns.findIndex((col) => col && col.id === overColumn.id);

      if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) return;

      // Reorder columns optimistically
      const newColumns = arrayMove(columns, sourceIndex, destinationIndex);
      setColumns(newColumns);

      // Update phases order
      const newPhases = arrayMove(phases, sourceIndex, destinationIndex);
      setPhases(newPhases);

      // Call API to persist the new order
      const phaseIds = newPhases.filter((p) => p && p.id).map((p) => p.id);
      if (phaseIds.length === 0 || !timelineId) return;

      rearrangePhases({ timelineId, phases: phaseIds })
        .unwrap()
        .then(() => {
          toast.success('Phase order updated successfully');
          refetchTimeline();
        })
        .catch((error: { data: TErrorResponse }) => {
          // Revert on error
          const originalColumns = transformPhasesToKanban(phases);
          setColumns(originalColumns);
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else {
            toast.error('Failed to update phase order');
          }
        });
      return;
    }

    // Otherwise, handle task dragging (existing logic)
    const activeCard = findCardById(active.id as string);
    if (!activeCard || !activeCard.id || !activeCard.task || !activeCard.task.id) return;

    const sourceColumn = findColumnByCardId(active.id as string);
    if (!sourceColumn || !sourceColumn.id) return;

    // Check if dropped on a column or another card
    let destinationColumn: KanbanColumn | null = null;
    let destinationIndex = -1;

    // Check if over.id is a column ID
    const columnById = findColumnById(over.id as string);
    if (columnById && columnById.id) {
      destinationColumn = columnById;
      // When dropped on column, append to end
      destinationIndex = destinationColumn.cards.length;
    } else {
      // Check if over.id is a card ID
      const cardById = findCardById(over.id as string);
      if (cardById && cardById.id) {
        destinationColumn = findColumnByCardId(over.id as string);
        if (destinationColumn && destinationColumn.id && destinationColumn.cards) {
          // Find the index of the target card
          const targetIndex = destinationColumn.cards.findIndex(
            (card) => card && card.id === over.id,
          );
          if (targetIndex !== -1) {
            destinationIndex = targetIndex;
          } else {
            // If card not found, append to end
            destinationIndex = destinationColumn.cards.length;
          }
        }
      }
    }

    if (
      !destinationColumn ||
      !destinationColumn.id ||
      !destinationColumn.phase ||
      !destinationColumn.phase.id
    )
      return;

    const sourceIndex = sourceColumn.cards.findIndex((card) => card && card.id === active.id);
    if (sourceIndex === -1) return;

    // Capture original order before any modifications (for comparison later)
    const originalOrder =
      sourceColumn.id === destinationColumn.id
        ? sourceColumn.cards
            .filter((card) => card && card.id && card.task && card.task.id)
            .map((card, index) => ({
              taskId: card.task!.id!,
              sNo: card.task!.sNo || index + 1,
              position: index,
            }))
        : null;

    // Check if order actually changed before doing any work
    if (sourceColumn.id === destinationColumn.id) {
      // Reordering within same column - check if position actually changed
      // Adjust destinationIndex to account for the card being removed
      let adjustedDestinationIndex = destinationIndex;
      if (destinationIndex > sourceIndex) {
        adjustedDestinationIndex = destinationIndex - 1;
      }
      // If the final position is the same as the source position, no change
      if (adjustedDestinationIndex === sourceIndex) {
        return; // No change in order
      }
    } else {
      // Moving between columns - this is always a change
      // No early return needed
    }

    // Update columns optimistically
    const newColumns = [...columns];
    const sourceCol = newColumns.find((col) => col && col.id === sourceColumn.id);
    const destCol = newColumns.find((col) => col && col.id === destinationColumn.id);

    if (
      !sourceCol ||
      !sourceCol.id ||
      !destCol ||
      !destCol.id ||
      !activeCard.task ||
      !activeCard.task.id
    )
      return;

    // Validate that sourceCol and destCol have cards arrays
    if (!sourceCol.cards || !destCol.cards) return;

    // Remove from source
    const [movedCard] = sourceCol.cards.splice(sourceIndex, 1);
    if (
      !movedCard ||
      !movedCard.id ||
      !movedCard.task ||
      !movedCard.task.id ||
      !destinationColumn.phase ||
      !destinationColumn.phase.id
    )
      return;

    // Update moved card's phase reference and task phaseId
    movedCard.phase = destinationColumn.phase;
    // Update the task object to reflect the new phaseId (TPhaseTask only has phaseId, not phase)
    movedCard.task = {
      ...movedCard.task,
      phaseId: destinationColumn.phase.id,
    };

    // Add to destination
    if (sourceColumn.id === destinationColumn.id) {
      // Reordering within same column
      // Since we already removed the card, adjust destinationIndex if needed
      if (destinationIndex > sourceIndex) {
        // Moving down: adjust index because we removed the card
        destinationIndex -= 1;
      }
      // Ensure destinationIndex is valid
      if (destinationIndex < 0) {
        destinationIndex = 0;
      }
      if (destinationIndex > destCol.cards.length) {
        destinationIndex = destCol.cards.length;
      }
      destCol.cards.splice(destinationIndex, 0, movedCard);
    } else {
      // Moving between columns
      // Ensure destinationIndex is valid
      if (destinationIndex < 0) {
        destinationIndex = 0;
      }
      if (destinationIndex > destCol.cards.length) {
        destinationIndex = destCol.cards.length;
      }
      destCol.cards.splice(destinationIndex, 0, movedCard);
    }

    setColumns(newColumns);

    // If task moved between phases, update phaseId via API
    if (
      sourceColumn.id !== destinationColumn.id &&
      activeCard.task &&
      activeCard.task.id &&
      destinationColumn.phase &&
      destinationColumn.phase.id
    ) {
      editTask({
        id: activeCard.task.id,
        name: activeCard.task.name || '', // Required field
        phaseId: destinationColumn.phase.id,
      })
        .unwrap()
        .then(() => {
          toast.success('Task moved successfully');
          // Refetch timeline data to get updated task with new phase information
          refetchTimeline();
        })
        .catch((error: { data: TErrorResponse }) => {
          // Revert on error
          const originalColumns = transformPhasesToKanban(phases);
          setColumns(originalColumns);
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else {
            toast.error('Failed to move task');
          }
        });
    } else {
      // Task reordered within same phase - update sNo for all tasks in the phase
      // Validate destCol and its cards array
      if (!destCol || !destCol.cards || !Array.isArray(destCol.cards)) {
        // Revert on error
        const originalColumns = transformPhasesToKanban(phases);
        setColumns(originalColumns);
        toast.error('Invalid destination column');
        return;
      }

      // Get the new order of task IDs
      const taskIds = destCol.cards
        .filter((card) => card && card.id && card.task && card.task.id)
        .map((card) => card.task!.id!);

      // Check if order actually changed by comparing with original order
      const originalTaskIds = originalOrder
        ? originalOrder.map((ot) => ot.taskId)
        : destCol.cards
            .filter((card) => card && card.id && card.task && card.task.id)
            .map((card) => card.task!.id!);

      // Compare arrays to see if order changed
      const orderChanged =
        taskIds.length !== originalTaskIds.length ||
        taskIds.some((id, index) => id !== originalTaskIds[index]);

      if (!orderChanged || taskIds.length === 0) {
        // No changes needed, order is already correct - revert the optimistic update
        const originalColumns = transformPhasesToKanban(phases);
        setColumns(originalColumns);
        return;
      }

      // Validate timelineId and phaseId
      if (!timelineId || !destinationColumn.phase || !destinationColumn.phase.id) {
        // Revert on error
        const originalColumns = transformPhasesToKanban(phases);
        setColumns(originalColumns);
        toast.error('Missing timeline or phase information');
        return;
      }

      // Update local state immediately with new sNo values
      destCol.cards.forEach((card, index) => {
        if (card && card.task && card.task.id) {
          card.task = {
            ...card.task,
            sNo: index + 1,
          };
        }
      });
      setColumns([...newColumns]);

      // Call API to rearrange tasks in the phase
      rearrangeTasks({
        timelineId,
        phaseId: destinationColumn.phase.id,
        tasks: taskIds,
      })
        .unwrap()
        .then(() => {
          toast.success('Task order updated successfully');
          // Refetch timeline data to get updated task order
          refetchTimeline();
        })
        .catch((error: { data: TErrorResponse }) => {
          // Revert on error
          const originalColumns = transformPhasesToKanban(phases);
          setColumns(originalColumns);
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else {
            toast.error('Failed to update task order');
          }
        });
    }
  }

  // Helper functions
  function findCardById(id: string): KanbanCard | null {
    if (!id) return null;
    for (const column of columns) {
      if (!column || !column.cards) continue;
      const card = column.cards.find((c) => c && c.id === id);
      if (card && card.id) return card;
    }
    return null;
  }

  function findColumnById(id: string): KanbanColumn | null {
    if (!id) return null;
    const column = columns.find((col) => col && col.id === id);
    return column && column.id ? column : null;
  }

  function findColumnByCardId(cardId: string): KanbanColumn | null {
    if (!cardId) return null;
    const column = columns.find(
      (col) => col && col.cards && col.cards.some((card) => card && card.id === cardId),
    );
    return column && column.id ? column : null;
  }

  function handleMarkTaskComplete(card: KanbanCard) {
    if (!card || !card.task || !card.task.id) {
      toast.error('Invalid task');
      return;
    }

    const taskId = card.task.id;
    const isCompleted = isTaskCompleted(card.task.status, card.task.taskStatus);

    markTaskComplete({ id: taskId })
      .unwrap()
      .then(() => {
        toast.success(isCompleted ? 'Task marked as incomplete' : 'Task marked as complete');
        // Refetch timeline data to get updated task status
        refetchTimeline();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error(
            isCompleted ? 'Unable to mark task as incomplete' : 'Unable to mark task as complete',
          );
        }
        console.error('Error marking task as complete:', error);
      });
  }

  function handleEditTask(card: KanbanCard) {
    if (!card || !card.phase || !card.phase.id || !card.task || !card.task.id) return;

    setSelectedPhase(card.phase);
    setSelectedTask({
      ...card.task,
      phase: {
        id: card.phase.id,
        project: {
          id: card.phase.projectId || '',
        },
        timeline: {
          id: card.phase.timelineId || '',
        },
      },
    });
    openEditTaskSidebar();
  }

  // Task name inline editing handlers
  function handleTaskNameEditStart(taskId: string) {
    if (!taskId) return;
    const card = findCardById(taskId);
    if (card && card.task && card.task.id) {
      setEditingTaskId(taskId);
      setEditingTaskName(card.task.name || '');
    }
  }

  function handleTaskNameEditChange(value: string) {
    setEditingTaskName(value);
  }

  function handleTaskNameEditSave(taskId: string) {
    if (!taskId) {
      setEditingTaskId(null);
      return;
    }

    if (!editingTaskName.trim()) {
      setEditingTaskId(null);
      return;
    }

    const card = findCardById(taskId);
    if (!card || !card.task || !card.task.id || card.task.name === editingTaskName.trim()) {
      setEditingTaskId(null);
      return;
    }

    editTask({
      id: taskId,
      name: editingTaskName.trim(),
    })
      .unwrap()
      .then(() => {
        toast.success('Task name updated successfully');
        setEditingTaskId(null);
        refetchTimeline();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to update task name');
        }
        // Revert to original name on error
        setEditingTaskId(null);
      });
  }

  function handleTaskNameEditCancel() {
    setEditingTaskId(null);
    setEditingTaskName('');
  }

  function handleDeleteTaskOpen(card: KanbanCard) {
    if (!card || !card.task || !card.task.id || !card.phase || !card.phase.id) return;

    setSelectedTask({
      ...card.task,
      phase: {
        id: card.phase.id,
        project: { id: card.phase.projectId || '' },
        timeline: { id: card.phase.timelineId || '' },
      },
    });
    openDeleteTaskModal();
  }

  function handleDeleteTask() {
    if (!selectedTask || !selectedTask.id) return;
    deleteProjectTask({ id: selectedTask.id })
      .unwrap()
      .then(() => {
        toast.success('Task deleted successfully');
        closeDeleteTaskModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.error('Error deleting task:', error);
      });
  }

  function handleAddTask(phase: TPhase) {
    if (!phase || !phase.id) return;
    setSelectedPhase(phase);
    setQuickAddPhaseId(phase.id);
  }

  function handleOpenAddTaskSidebar(phase: TPhase) {
    if (!phase || !phase.id) return;
    setSelectedPhase(phase);
    openAddTaskSidebar();
  }

  function handleCloseAddTaskSidebar() {
    closeAddTaskSidebar();
    setSelectedPhase(null);
  }

  function handleQuickAddSuccess() {
    setQuickAddPhaseId(null);
    setSelectedPhase(null);
  }

  // Phase editing handlers
  function handlePhaseEditStart(phaseId: string) {
    if (!phaseId) return;
    const phase = phases.find((p) => p && p.id === phaseId);
    if (phase && phase.id) {
      setEditingPhaseId(phaseId);
      setEditingPhaseName(phase.name || '');
    }
  }

  function handlePhaseEditChange(value: string) {
    setEditingPhaseName(value);
  }

  function handlePhaseEditSave(phaseId: string) {
    if (!editingPhaseName.trim()) {
      setEditingPhaseId(null);
      return;
    }

    const phase = phases.find((p) => p.id === phaseId);
    if (!phase || phase.name === editingPhaseName) {
      setEditingPhaseId(null);
      return;
    }

    if (!phase.id) {
      setEditingPhaseId(null);
      return;
    }

    editPhase({
      id: phase.id,
      name: editingPhaseName.trim(),
    })
      .unwrap()
      .then(() => {
        toast.success('Phase renamed successfully');
        setEditingPhaseId(null);
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to rename phase');
        }
        // Revert to original name
        const phase = phases.find((p) => p.id === phaseId);
        if (phase) {
          setEditingPhaseName(phase.name);
        }
      });
  }

  function handlePhaseEditCancel() {
    setEditingPhaseId(null);
    if (!editingPhaseId) return;
    const phase = phases.find((p) => p && p.id === editingPhaseId);
    if (phase && phase.id) {
      setEditingPhaseName(phase.name || '');
    }
  }

  function handlePhaseMoveLeft(phaseId: string) {
    if (!phaseId) return;
    const currentIndex = phases.findIndex((p) => p && p.id === phaseId);
    if (currentIndex <= 0) return;

    const newPhases = [...phases];
    [newPhases[currentIndex - 1], newPhases[currentIndex]] = [
      newPhases[currentIndex],
      newPhases[currentIndex - 1],
    ];
    setPhases(newPhases);

    const phaseIds = newPhases.filter((p) => p && p.id).map((p) => p.id);
    if (phaseIds.length === 0 || !timelineId) return;
    rearrangePhases({ timelineId, phases: phaseIds })
      .unwrap()
      .then(() => {
        toast.success('Phase moved successfully');
        // Refetch timeline data to ensure UI is in sync with backend
        refetchTimeline();
      })
      .catch((error: { data: TErrorResponse }) => {
        // Revert on error
        setPhases(phases);
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to move phase');
        }
      });
  }

  function handlePhaseMoveRight(phaseId: string) {
    if (!phaseId) return;
    const currentIndex = phases.findIndex((p) => p && p.id === phaseId);
    if (currentIndex < 0 || currentIndex >= phases.length - 1) return;

    const newPhases = [...phases];
    [newPhases[currentIndex], newPhases[currentIndex + 1]] = [
      newPhases[currentIndex + 1],
      newPhases[currentIndex],
    ];
    setPhases(newPhases);

    const phaseIds = newPhases.filter((p) => p && p.id).map((p) => p.id);
    if (phaseIds.length === 0 || !timelineId) return;
    rearrangePhases({ timelineId, phases: phaseIds })
      .unwrap()
      .then(() => {
        toast.success('Phase moved successfully');
        // Refetch timeline data to ensure UI is in sync with backend
        refetchTimeline();
      })
      .catch((error: { data: TErrorResponse }) => {
        // Revert on error
        setPhases(phases);
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to move phase');
        }
      });
  }

  function handlePhaseRename(phaseId: string) {
    if (!phaseId) return;
    const phase = phases.find((p) => p && p.id === phaseId);
    if (phase && phase.id) {
      setSelectedPhase(phase);
      openEditPhaseSidebar();
    }
  }

  function handlePhaseDelete(phaseId: string) {
    if (!phaseId) return;
    const phase = phases.find((p) => p && p.id === phaseId);
    if (phase && phase.id) {
      setPhaseToDelete(phase);
      openDeletePhaseModal();
    }
  }

  function handleDeletePhaseConfirm() {
    if (!phaseToDelete || !phaseToDelete.id) return;

    deletePhase({ id: phaseToDelete.id })
      .unwrap()
      .then(() => {
        toast.success('Phase deleted successfully');
        closeDeletePhaseModal();
        setPhaseToDelete(null);
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to delete phase');
        }
      });
  }

  return (
    <>
      <div className='bg-white overflow-x-auto overflow-y-auto p-4'>
        {columns.length === 0 ? (
          <div className='flex justify-end mb-4'>
            <Button
              onClick={openAddPhaseSidebar}
              radius='full'
              className='text-orange-400! bg-orange-50 hover:bg-orange-100'
            >
              + Add New Phase
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          <ListView
            columns={columns}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTaskOpen}
            onMarkTaskComplete={handleMarkTaskComplete}
            isMarkingComplete={isMarkingComplete}
            onRearrangePhases={(phaseIds) => {
              if (timelineId) {
                rearrangePhases({ timelineId, phases: phaseIds })
                  .unwrap()
                  .then(() => {
                    toast.success('Phase order updated successfully');
                    refetchTimeline();
                  })
                  .catch((error: { data: TErrorResponse }) => {
                    if (error?.data?.message) {
                      toast.error(error?.data?.message);
                    } else {
                      toast.error('Failed to update phase order');
                    }
                  });
              }
            }}
            onRearrangeTasks={(phaseId, taskIds) => {
              if (timelineId) {
                rearrangeTasks({ timelineId, phaseId, tasks: taskIds })
                  .unwrap()
                  .then(() => {
                    toast.success('Task order updated successfully');
                    refetchTimeline();
                  })
                  .catch((error: { data: TErrorResponse }) => {
                    // Revert on error
                    refetchTimeline();
                    if (error?.data?.message) {
                      toast.error(error?.data?.message);
                    } else {
                      toast.error('Failed to update task order');
                    }
                  });
              }
            }}
            timelineId={timelineId || undefined}
            setColumns={setColumns}
            editTask={editTask}
            refetchTimeline={refetchTimeline}
            onTaskCreated={handleTaskCreated}
            onOpenAddTaskSidebar={handleOpenAddTaskSidebar}
            onCreatePhase={openAddPhaseSidebar}
            projectId={projectId}
          />
        ) : (
          <div className='space-y-4'>
            {/* Filter controls for card view */}
            <div className='flex items-center gap-3 px-4'>
              <StatusSelector
                options={statusOptions}
                inputClassName='!border !border-border-light rounded-md'
                className='min-w-[150px]'
              />
              <label className='flex items-center gap-2 cursor-pointer select-none'>
                <input
                  type='checkbox'
                  checked={assignedToMe}
                  onChange={(e) => setParams('assignedToMe', e.target.checked ? 'true' : '')}
                  className='w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500'
                />
                <span className='text-sm text-gray-700'>Assigned to Me</span>
              </label>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.filter((col) => col && col.id).map((col) => col.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className='flex gap-4 overflow-x-auto pb-4 items-start'>
                  {filteredColumnsForCardView.map((column, index) => {
                    const isEditing = editingPhaseId === column.id;
                    const canMoveLeft = index > 0;
                    const canMoveRight = index < filteredColumnsForCardView.length - 1;
                    const showQuickAdd = quickAddPhaseId === column.id;

                    return (
                      <DraggableKanbanColumn
                        key={column.id}
                        column={column}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTaskOpen}
                        onMarkTaskComplete={handleMarkTaskComplete}
                        isMarkingComplete={isMarkingComplete}
                        onAddTask={handleAddTask}
                        isEditing={isEditing}
                        editingValue={editingPhaseName}
                        onEditStart={() => handlePhaseEditStart(column.id)}
                        onEditChange={handlePhaseEditChange}
                        onEditSave={() => handlePhaseEditSave(column.id)}
                        onEditCancel={handlePhaseEditCancel}
                        onMoveLeft={() => handlePhaseMoveLeft(column.id)}
                        onMoveRight={() => handlePhaseMoveRight(column.id)}
                        onRename={() => handlePhaseRename(column.id)}
                        onDelete={() => handlePhaseDelete(column.id)}
                        canMoveLeft={canMoveLeft}
                        canMoveRight={canMoveRight}
                        showQuickAddForm={showQuickAdd}
                        projectId={projectId || ''}
                        onQuickAddSuccess={handleQuickAddSuccess}
                        onTaskCreated={handleTaskCreated}
                        editingTaskId={editingTaskId}
                        editingTaskName={editingTaskName}
                        onTaskNameEditStart={handleTaskNameEditStart}
                        onTaskNameEditChange={handleTaskNameEditChange}
                        onTaskNameEditSave={handleTaskNameEditSave}
                        onTaskNameEditCancel={handleTaskNameEditCancel}
                      />
                    );
                  })}
                  <AddPhaseColumn onAddPhase={openAddPhaseSidebar} />
                </div>
              </SortableContext>
              <DragOverlay>
                {activeCard ? (
                  <div className='rotate-3 opacity-90 bg-white border border-gray-200 rounded-lg p-3 shadow-lg min-w-[300px]'>
                    <div className='font-semibold text-sm text-gray-900 mb-1'>
                      {activeCard.title}
                    </div>
                    <div className='text-xs text-gray-600'>
                      {activeCard.description || 'No description'}
                    </div>
                  </div>
                ) : activeColumn ? (
                  <div className='rotate-3 opacity-90 bg-gray-50 rounded-lg p-4 min-w-[300px] max-w-[350px]'>
                    <div className='text-orange-400 font-semibold text-sm mb-3'>
                      {activeColumn.title}
                    </div>
                    <div className='text-xs text-gray-500'>{activeColumn.cards.length} tasks</div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
      <AddTaskSidebar
        phaseName={selectedPhase?.name}
        phaseId={selectedPhase?.id}
        fixedProjectId={projectId ?? undefined}
        onClose={handleCloseAddTaskSidebar}
        isOpen={isOpenedAddTaskSidebar}
        onTaskCreated={handleTaskCreated}
      />
      <AddProjectPhaseSidebar isOpen={isOpenedAddPhaseSidebar} onClose={closeAddPhaseSidebar} />
      <EditProjectTaskSidebar
        onClose={closeEditTaskSidebar}
        isOpen={isOpenedEditTaskSidebar}
        task={selectedTask}
        phaseId={selectedPhase?.id || ''}
      />
      <AlertModal
        isLoading={isDeletingTask}
        onConfirm={handleDeleteTask}
        title={`Delete ${selectedTask?.name}?`}
        onClose={closeDeleteTaskModal}
        opened={isOpenedDeleteTaskModal}
      />
      <AddProjectPhaseSidebar
        isOpen={isOpenedEditPhaseSidebar}
        onClose={closeEditPhaseSidebar}
        phaseData={selectedPhase}
        mode={'edit' as const}
      />
      <AlertModal
        isLoading={isDeletingPhase}
        onConfirm={handleDeletePhaseConfirm}
        title={`Delete ${phaseToDelete?.name}?`}
        subtitle="This action can't be undone"
        onClose={closeDeletePhaseModal}
        opened={isOpenedDeletePhaseModal}
      />
    </>
  );
}
