import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table } from '@mantine/core';
import { toast } from 'react-toastify';

import type { TErrorResponse } from '../../../../../store/types/common.types';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconChevronDown, IconGripHorizontal, IconPlus } from '@tabler/icons-react';
import { TaskListItem } from './TaskListItem';
import { Button } from '../../../../../components';
import type { TPhase } from '../../../../../store/types/phase.types';
import type { TTask, TTaskAssignee } from '../../../../../store/types/task.types';
import { statusOptions } from '../../../../tasks/constants/constants';
import StatusSelector from '../../../../../components/common/selectors/StatusSelector';
import useUrlSearchParams from '../../../../../hooks/useUrlSearchParams';

import { getUser } from '../../../../../utils/auth';
import { TASK_STATUS } from '../../../../../constants/ui';

type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  task: any;
  phase: TPhase;
};

type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
  phase: TPhase;
};

interface ListViewProps {
  columns: KanbanColumn[];
  onEditTask: (card: KanbanCard) => void;
  onDeleteTask: (card: KanbanCard) => void;
  onMarkTaskComplete?: (card: KanbanCard) => void;
  isMarkingComplete?: boolean;
  onRearrangePhases?: (phaseIds: string[]) => void;
  onRearrangeTasks?: (phaseId: string, taskIds: string[]) => void;
  timelineId?: string;
  setColumns?: (columns: KanbanColumn[]) => void;
  editTask?: (payload: {
    id: string;
    name: string;
    phaseId?: string;
    taskStatus?: (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
    [key: string]: any;
  }) => {
    unwrap: () => Promise<void>;
  };
  refetchTimeline?: () => void;
  onTaskCreated?: (task: TTask) => void;
  onOpenAddTaskSidebar?: (phase: TPhase) => void;
  onCreatePhase?: () => void;
  projectId?: string;
}

// Helper function to find card by ID across all columns
function findCardByIdInColumns(columns: KanbanColumn[], cardId: string): KanbanCard | null {
  if (!cardId) return null;
  for (const column of columns) {
    if (!column || !column.cards) continue;
    const card = column.cards.find((c) => c && c.id === cardId);
    if (card && card.id) return card;
  }
  return null;
}

// Helper function to find column by card ID
function findColumnByCardIdInColumns(columns: KanbanColumn[], cardId: string): KanbanColumn | null {
  if (!cardId) return null;
  for (const column of columns) {
    if (!column || !column.cards) continue;
    const card = column.cards.find((c) => c && c.id === cardId);
    if (card && card.id) return column;
  }
  return null;
}

// Helper function to find column by ID
function findColumnByIdInColumns(columns: KanbanColumn[], columnId: string): KanbanColumn | null {
  if (!columnId) return null;
  const column = columns.find((col) => col && col.id === columnId);
  return column && column.id ? column : null;
}

// Draggable Phase Accordion Item
function DraggablePhaseAccordion({
  column,
  isOpen,
  onToggle,
  onEditTask,
  onDeleteTask,
  onMarkTaskComplete,
  isMarkingComplete,
  onStatusUpdate,
  onOpenAddTaskSidebar,
}: {
  column: KanbanColumn;
  isOpen: boolean;
  onToggle: () => void;
  onEditTask: (card: KanbanCard) => void;
  onDeleteTask: (card: KanbanCard) => void;
  onMarkTaskComplete?: (card: KanbanCard) => void;
  isMarkingComplete?: boolean;
  onRearrangeTasks?: (phaseId: string, taskIds: string[]) => void;
  timelineId?: string;
  setColumns?: (columns: KanbanColumn[]) => void;
  columns?: KanbanColumn[];
  projectId?: string;
  onStatusUpdate?: (taskId: string, newStatus: string) => Promise<void>;
  onTaskCreated?: (task: TTask) => void;
  onOpenAddTaskSidebar?: (phase: TPhase) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: {
      type: 'phase',
      column,
    },
  });

  const cardIds = column.cards.filter((card) => card && card.id).map((card) => card.id);

  // Make phase droppable for tasks
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'phase',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const phaseDragHandleProps = {
    ...attributes,
    ...listeners,
    style: { touchAction: 'none', cursor: 'grab' } as React.CSSProperties,
  };

  // Combine refs for both sortable and droppable
  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={`border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
        isOpen ? 'shadow-lg' : ''
      } ${isOver ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200'}`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-lg ${
          isOpen ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50 border-gray-100'
        }`}
        onClick={onToggle}
      >
        <div
          {...phaseDragHandleProps}
          className='cursor-grab active:cursor-grabbing text-orange-400 hover:text-orange-500 shrink-0'
          onClick={(e) => e.stopPropagation()}
        >
          <IconGripHorizontal className='size-4' />
        </div>
        <IconChevronDown
          className={`size-5 text-orange-500 transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
        <h3
          className={`font-semibold text-base flex-1 ${
            isOpen ? 'text-orange-700' : 'text-orange-600'
          }`}
        >
          {column.title}
        </h3>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            isOpen ? 'bg-orange-200 text-orange-800' : 'bg-orange-100 text-orange-700'
          }`}
        >
          {column.cards.length} {column.cards.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {isOpen && (
        <div className='border-t bg-linear-to-b from-orange-50/30 to-white'>
          {column.cards.length === 0 ? (
            <div className='p-4 text-center text-gray-500'>
              <p className='text-sm mb-4'>No tasks in this phase</p>
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className='inline-flex'
              >
                <Button
                  onClick={() => onOpenAddTaskSidebar?.(column.phase)}
                  variant='light'
                  size='sm'
                  className='text-orange-600 hover:bg-orange-100'
                  leftIcon={<IconPlus size={16} />}
                >
                  Create Task
                </Button>
              </div>
            </div>
          ) : (
            <div className='p-4'>
              {/* {onCreateTask && (
                <div className='mb-3 flex justify-end'>
                  <Button
                    onClick={() => {
                      if (onCreateTask && column.phase) {
                        onCreateTask(column.phase);
                      }
                    }}
                    variant='light'
                    size='sm'
                    className='text-orange-600 hover:bg-orange-100'
                    leftIcon={<IconPlus size={16} />}
                  >
                    Create Task
                  </Button>
                </div>
              )} */}
              <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                <div className='overflow-x-auto overflow-y-visible'>
                  <Table
                    className='w-full table-fixed'
                    verticalSpacing='xs'
                    highlightOnHover
                    style={{ tableLayout: 'fixed', width: '100%' }}
                  >
                    <Table.Thead className='sticky top-0 bg-gray-50 z-10'>
                      <Table.Tr className='bg-gray-50 border-b-2 border-gray-300'>
                        <Table.Th className='w-12 text-center py-3 px-2'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Drag
                          </span>
                        </Table.Th>
                        <Table.Th className='w-16 text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            ID
                          </span>
                        </Table.Th>
                        <Table.Th className='min-w-[200px] text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Task Name
                          </span>
                        </Table.Th>
                        <Table.Th className='w-28 text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Duration
                          </span>
                        </Table.Th>
                        <Table.Th className='w-36 text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap'>
                            Start Date
                          </span>
                        </Table.Th>
                        <Table.Th className='w-36 text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap'>
                            End Date
                          </span>
                        </Table.Th>
                        <Table.Th className='min-w-[150px] text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Assigned To
                          </span>
                        </Table.Th>
                        <Table.Th className='min-w-[120px] text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Assigned By
                          </span>
                        </Table.Th>
                        <Table.Th className='w-28 text-center py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Status
                          </span>
                        </Table.Th>
                        <Table.Th className='w-32 text-center py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Progress
                          </span>
                        </Table.Th>
                        <Table.Th className='w-36 text-center py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap'>
                            Actions
                          </span>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {column.cards.map((card) => (
                        <DraggableTaskRow
                          key={card.id}
                          card={card}
                          onEdit={() => onEditTask(card)}
                          onDelete={() => onDeleteTask(card)}
                          onMarkComplete={
                            onMarkTaskComplete ? () => onMarkTaskComplete(card) : undefined
                          }
                          isMarkingComplete={isMarkingComplete}
                          onStatusUpdate={onStatusUpdate}
                        />
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </SortableContext>
              <div className='mt-4 flex justify-start'>
                <Button
                  onClick={() => onOpenAddTaskSidebar?.(column.phase)}
                  variant='light'
                  size='sm'
                  className='text-orange-600 hover:bg-orange-100'
                  leftIcon={<IconPlus size={16} />}
                >
                  Add Task
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Draggable Task Row
function DraggableTaskRow({
  card,
  onEdit,
  onDelete,
  onMarkComplete,
  isMarkingComplete,
  onStatusUpdate,
}: {
  card: KanbanCard;
  onEdit: () => void;
  onDelete: () => void;
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
  onStatusUpdate?: (taskId: string, newStatus: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'task', card },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Table.Tr
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-colors hover:bg-orange-50/50 ${isDragging ? 'bg-orange-50' : ''}`}
      onClick={onEdit}
    >
      <TaskListItem
        card={card}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkComplete={onMarkComplete}
        isMarkingComplete={isMarkingComplete}
        onStatusUpdate={onStatusUpdate}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          style: { cursor: 'grab', touchAction: 'none' },
        }}
      />
    </Table.Tr>
  );
}

export function ListView({
  columns,
  onEditTask,
  onDeleteTask,
  onMarkTaskComplete,
  isMarkingComplete,
  onRearrangePhases,
  onRearrangeTasks,
  timelineId,
  setColumns,
  editTask,
  refetchTimeline,
  onTaskCreated,
  onOpenAddTaskSidebar,
  onCreatePhase,
  projectId,
}: ListViewProps) {
  const { id } = useParams();
  const { getParam, setParams } = useUrlSearchParams();
  const selectedTaskStatus = getParam('status');
  const phaseIdFromUrl = getParam('phaseId');
  const assignedToMeParam = getParam('assignedToMe');
  const assignedToMe = assignedToMeParam === 'true';
  const currentUser = getUser();

  // Initialize with phase from URL or first phase
  const getInitialOpenPhaseIds = () => {
    if (phaseIdFromUrl) {
      return new Set([phaseIdFromUrl]);
    }
    return new Set(columns.length > 0 && columns[0].id ? [columns[0].id] : []);
  };

  const [openPhaseIds, setOpenPhaseIds] = useState<Set<string>>(getInitialOpenPhaseIds);
  const [activePhase, setActivePhase] = useState<KanbanColumn | null>(null);
  const [activeTask, setActiveTask] = useState<KanbanCard | null>(null);

  // Update open phase when URL param changes
  useEffect(() => {
    if (phaseIdFromUrl) {
      setOpenPhaseIds(new Set([phaseIdFromUrl]));
    }
  }, [phaseIdFromUrl]);

  // Handler for inline status updates with predecessor validation
  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    if (!editTask || !taskId) {
      throw new Error('Invalid task or edit function');
    }

    // Find the task to get its name
    const card = findCardByIdInColumns(columns, taskId);
    if (!card || !card.task) {
      throw new Error('Task not found');
    }

    return editTask({
      id: taskId,
      name: card.task.name || card.title || '',
      taskStatus: newStatus as (typeof TASK_STATUS)[keyof typeof TASK_STATUS],
    })
      .unwrap()
      .then(() => {
        toast.success('Task status updated successfully');
        if (refetchTimeline) {
          refetchTimeline();
        }
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          throw new Error(error.data.message);
        }
        throw new Error('Failed to update task status');
      });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor),
  );

  function handlePhaseToggle(phaseId: string) {
    // Toggle the phase - allow multiple phases to be open at once
    setOpenPhaseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (!active || !active.id) return;

    // Check if dragging a phase
    const column = findColumnByIdInColumns(columns, active.id as string);
    if (column && column.id) {
      setActivePhase(column);
      setActiveTask(null);
      return;
    }

    // Otherwise, it's a task
    const card = findCardByIdInColumns(columns, active.id as string);
    if (card && card.id && card.task && card.task.id) {
      setActiveTask(card);
      setActivePhase(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActivePhase(null);
    setActiveTask(null);

    // Early return if no active or over, or missing IDs
    if (!active || !active.id) return;
    if (!over || !over.id) return;

    // Check if we're dragging a phase column
    const draggedColumn = findColumnByIdInColumns(columns, active.id as string);
    if (draggedColumn && draggedColumn.id) {
      // Handle phase reordering
      let overColumn = findColumnByIdInColumns(columns, over.id as string);

      // If dropped on a task, find its parent column
      if (!overColumn || !overColumn.id) {
        const card = findCardByIdInColumns(columns, over.id as string);
        if (card && card.id) {
          overColumn = findColumnByCardIdInColumns(columns, over.id as string);
        }
      }

      if (
        !overColumn ||
        !overColumn.id ||
        !draggedColumn.id ||
        draggedColumn.id === overColumn.id
      ) {
        return;
      }

      const sourceIndex = columns.findIndex((col) => col && col.id === draggedColumn.id);
      const destinationIndex = columns.findIndex((col) => col && col.id === overColumn.id);

      if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) return;

      const newColumns = arrayMove(columns, sourceIndex, destinationIndex);

      // Optimistically update columns
      if (setColumns) {
        setColumns([...newColumns]);
      }

      const phaseIds = newColumns
        .filter((col) => col && col.id && col.phase && col.phase.id)
        .map((col) => col.phase!.id!);

      if (onRearrangePhases && phaseIds.length > 0) {
        onRearrangePhases(phaseIds);
      }
      return;
    }

    // Otherwise, handle task dragging
    const activeCard = findCardByIdInColumns(columns, active.id as string);
    if (!activeCard || !activeCard.id || !activeCard.task || !activeCard.task.id) return;

    const sourceColumn = findColumnByCardIdInColumns(columns, active.id as string);
    if (!sourceColumn || !sourceColumn.id) return;

    // Check if dropped on a column or another card
    let destinationColumn: KanbanColumn | null = null;
    let destinationIndex = -1;

    // Check if over.id is a column ID
    const columnById = findColumnByIdInColumns(columns, over.id as string);
    if (columnById && columnById.id) {
      destinationColumn = columnById;
      destinationIndex = destinationColumn.cards.length;
    } else {
      // Check if over.id is a card ID
      const cardById = findCardByIdInColumns(columns, over.id as string);
      if (cardById && cardById.id) {
        destinationColumn = findColumnByCardIdInColumns(columns, over.id as string);
        if (destinationColumn && destinationColumn.id && destinationColumn.cards) {
          const targetIndex = destinationColumn.cards.findIndex(
            (card) => card && card.id === over.id,
          );
          if (targetIndex !== -1) {
            destinationIndex = targetIndex;
          } else {
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

    // Update moved card's phase reference
    movedCard.phase = destinationColumn.phase;
    movedCard.task = {
      ...movedCard.task,
      phaseId: destinationColumn.phase.id,
    };

    // Add to destination
    if (sourceColumn.id === destinationColumn.id) {
      // Reordering within same column
      if (destinationIndex > sourceIndex) {
        destinationIndex -= 1;
      }
      if (destinationIndex < 0) {
        destinationIndex = 0;
      }
      if (destinationIndex > destCol.cards.length) {
        destinationIndex = destCol.cards.length;
      }
      destCol.cards.splice(destinationIndex, 0, movedCard);
    } else {
      // Moving between columns
      if (destinationIndex < 0) {
        destinationIndex = 0;
      }
      if (destinationIndex > destCol.cards.length) {
        destinationIndex = destCol.cards.length;
      }
      destCol.cards.splice(destinationIndex, 0, movedCard);
    }

    if (setColumns) {
      setColumns([...newColumns]);
    }

    // If task moved between phases, update phaseId via API
    if (
      sourceColumn.id !== destinationColumn.id &&
      activeCard.task &&
      activeCard.task.id &&
      destinationColumn.phase &&
      destinationColumn.phase.id
    ) {
      if (editTask) {
        editTask({
          id: activeCard.task.id,
          name: activeCard.task.name || '',
          phaseId: destinationColumn.phase.id,
        })
          .unwrap()
          .then(() => {
            toast.success('Task moved successfully');
            if (refetchTimeline) {
              refetchTimeline();
            }
          })
          .catch((error: { data: TErrorResponse }) => {
            // Revert on error
            if (setColumns) {
              setColumns(columns);
            }
            if (error?.data?.message) {
              toast.error(error?.data?.message);
            } else {
              toast.error('Failed to move task');
            }
          });
      }
    } else {
      // Task reordered within same phase
      if (!destCol || !destCol.cards || !Array.isArray(destCol.cards)) return;

      const taskIds = destCol.cards
        .filter((card) => card && card.id && card.task && card.task.id)
        .map((card) => card.task!.id!);

      if (onRearrangeTasks && timelineId && destinationColumn.phase && destinationColumn.phase.id) {
        onRearrangeTasks(destinationColumn.phase.id, taskIds);
      }
    }
  }

  // Filter columns by taskStatus and assignedToMe
  const filteredColumns = columns.map((col) => ({
    ...col,
    cards: col.cards.filter((card) => {
      // Filter by status if selected
      if (selectedTaskStatus) {
        const taskStatus = card.task?.taskStatus || card.task?.status || '';
        if (taskStatus !== selectedTaskStatus) return false;
      }
      // Filter by assigned to me if enabled
      if (assignedToMe && currentUser?.id) {
        const assignees: TTaskAssignee[] = card.task?.TaskAssignee || [];
        const isAssignedToMe = assignees.some(
          (assignee: TTaskAssignee) => assignee?.User?.id === currentUser.id,
        );
        if (!isAssignedToMe) return false;
      }
      return true;
    }),
  }));

  if (columns.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-64 gap-4'>
        <p className='text-gray-500 text-center'>No phases found</p>
        {onCreatePhase && (
          <Button
            onClick={onCreatePhase}
            radius='full'
            className='text-orange-400! bg-orange-50 hover:bg-orange-100'
            leftIcon={<IconPlus size={16} />}
          >
            Add New Phase
          </Button>
        )}
      </div>
    );
  }

  const phaseIds = columns.filter((col) => col && col.id).map((col) => col.id);
  const allTaskIds = columns.flatMap((col) =>
    col.cards.filter((card) => card && card.id).map((card) => card.id),
  );

  return (
    <div className='bg-gray-50 p-4 min-h-full'>
      <div className='mb-4 flex justify-between items-center gap-4 flex-wrap'>
        <div className='flex items-center gap-3'>
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
        {onCreatePhase && (
          <Button
            onClick={onCreatePhase}
            radius='full'
            className='text-orange-400! bg-orange-50 hover:bg-orange-100'
            leftIcon={<IconPlus size={16} />}
          >
            Add New Phase
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={[...phaseIds, ...allTaskIds]}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-3'>
            {filteredColumns.map((column) => (
              <DraggablePhaseAccordion
                key={column.id}
                column={column}
                isOpen={openPhaseIds.has(column.id)}
                onToggle={() => handlePhaseToggle(column.id)}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onMarkTaskComplete={onMarkTaskComplete}
                isMarkingComplete={isMarkingComplete}
                projectId={projectId || id}
                onStatusUpdate={handleStatusUpdate}
                onTaskCreated={onTaskCreated}
                onOpenAddTaskSidebar={onOpenAddTaskSidebar}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activePhase ? (
            <div className='bg-white border border-gray-200 rounded-lg p-4 shadow-lg min-w-[400px]'>
              <div className='font-semibold text-gray-900 mb-2'>{activePhase.title}</div>
              <div className='text-xs text-gray-500'>{activePhase.cards.length} tasks</div>
            </div>
          ) : activeTask ? (
            <div className='bg-white border border-gray-200 rounded shadow-lg p-2 min-w-[300px]'>
              <div className='font-medium text-sm'>{activeTask.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
