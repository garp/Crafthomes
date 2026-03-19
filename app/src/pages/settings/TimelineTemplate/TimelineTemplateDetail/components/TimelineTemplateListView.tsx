import { useState, useEffect } from 'react';
import { Table } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'react-toastify';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import {
  IconChevronDown,
  IconGripHorizontal,
  IconPlus,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';

import { Button, DeleteButton, EditButton } from '../../../../../components';
import IconButton from '../../../../../components/base/button/IconButton';
import AlertModal from '../../../../../components/base/AlertModal';
import type { TProjectTypeMasterPhase } from '../../../../../store/types/projectType.types';
import type { TErrorResponse } from '../../../../../store/types/common.types';
import {
  useRearrangeMasterPhasesMutation,
  useRearrangeMasterTasksMutation,
  useRemoveMasterPhaseFromProjectTypeMutation,
  useRemoveMasterTaskFromMasterPhaseMutation,
} from '../../../../../store/services/projectType/projectTypeSlice';
import AddEditMasterPhaseSidebar from '../../../../../components/settings/AddEditMasterPhaseSidebar';
import AddMasterTaskSidebar from '../../../../../components/settings/AddMasterTaskSidebar';
import EditMasterTaskSidebar from '../../../../../components/settings/EditMasterTaskSidebar';
import type { TMasterTask } from '../../../../../store/types/masterTask.types';
import { useLazyGetMasterTasksQuery } from '../../../../../store/services/masterTask/masterTask';

type MasterTaskItem = {
  id: string;
  name: string;
  description?: string | null;
};

type PhaseWithTasks = TProjectTypeMasterPhase & {
  tasks: MasterTaskItem[];
};

type TimelineTemplateListViewProps = {
  projectTypeId: string;
  phases: TProjectTypeMasterPhase[];
  refetchData: () => void;
};

// Transform phases to include tasks (masterTasks is already a direct array from getProjectTypeById)
function transformPhases(phases: TProjectTypeMasterPhase[]): PhaseWithTasks[] {
  return phases.map((phase) => ({
    ...phase,
    tasks:
      phase.masterTasks?.map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description,
      })) || [],
  }));
}

// Draggable Phase Accordion
function DraggablePhaseAccordion({
  phase,
  isOpen,
  onToggle,
  onEditPhase,
  onDeletePhase,
  onEditTask,
  onDeleteTask,
  onAddTask,
}: {
  phase: PhaseWithTasks;
  isOpen: boolean;
  onToggle: () => void;
  onEditPhase: (phase: PhaseWithTasks) => void;
  onDeletePhase: (phase: PhaseWithTasks) => void;
  onEditTask: (task: MasterTaskItem, phaseId: string) => void;
  onDeleteTask: (task: MasterTaskItem, phaseId: string) => void;
  onAddTask: (phaseId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: phase.id,
    data: { type: 'phase', phase },
  });

  const taskIds = phase.tasks.map((task) => task.id);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
        isOpen ? 'shadow-lg' : ''
      } border-gray-200`}
    >
      {/* Phase Header */}
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
          {phase.name}
        </h3>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            isOpen ? 'bg-orange-200 text-orange-800' : 'bg-orange-100 text-orange-700'
          }`}
        >
          {phase.tasks.length} {phase.tasks.length === 1 ? 'task' : 'tasks'}
        </span>
        <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
          <IconButton
            onClick={() => onEditPhase(phase)}
            className='hover:bg-orange-100 rounded p-1'
          >
            <IconPencil className='size-4 text-orange-400' />
          </IconButton>
          <IconButton onClick={() => onDeletePhase(phase)} className='hover:bg-red-100 rounded p-1'>
            <IconTrash className='size-4 text-red-400' />
          </IconButton>
        </div>
      </div>

      {/* Tasks List */}
      {isOpen && (
        <div className='border-t bg-gradient-to-b from-orange-50/30 to-white'>
          {phase.tasks.length === 0 ? (
            <div className='p-8 text-center text-gray-500'>
              <p className='text-sm mb-4'>No tasks in this phase</p>
              <Button
                onClick={() => onAddTask(phase.id)}
                variant='light'
                size='sm'
                className='text-orange-600 hover:bg-orange-100'
                leftIcon={<IconPlus size={16} />}
              >
                Add Task
              </Button>
            </div>
          ) : (
            <div className='p-4'>
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className='overflow-x-auto'>
                  <Table className='w-full' verticalSpacing='xs' highlightOnHover>
                    <Table.Thead className='sticky top-0 bg-gray-50 z-10'>
                      <Table.Tr className='bg-gray-50 border-b-2 border-gray-300'>
                        <Table.Th className='w-12 text-center py-3 px-2'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Drag
                          </span>
                        </Table.Th>
                        <Table.Th className='min-w-[200px] text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Task Name
                          </span>
                        </Table.Th>
                        <Table.Th className='min-w-[300px] text-left py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Description
                          </span>
                        </Table.Th>
                        <Table.Th className='w-32 text-center py-3 px-3'>
                          <span className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                            Actions
                          </span>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {phase.tasks.map((task) => (
                        <DraggableTaskRow
                          key={task.id}
                          task={task}
                          phaseId={phase.id}
                          onEdit={() => onEditTask(task, phase.id)}
                          onDelete={() => onDeleteTask(task, phase.id)}
                        />
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </SortableContext>
              <div className='mt-4 flex justify-start'>
                <Button
                  onClick={() => onAddTask(phase.id)}
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
  task,
  phaseId,
  onEdit,
  onDelete,
}: {
  task: MasterTaskItem;
  phaseId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task, phaseId },
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
      className={`cursor-pointer hover:bg-orange-50/50 transition-colors ${isDragging ? 'bg-orange-50' : ''}`}
      onClick={onEdit}
    >
      <Table.Td className='text-center' onClick={(e) => e.stopPropagation()}>
        <div
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 inline-flex'
          style={{ touchAction: 'none' }}
        >
          <IconGripHorizontal className='size-4' />
        </div>
      </Table.Td>
      <Table.Td>
        <span className='text-sm font-medium text-gray-900'>{task.name}</span>
      </Table.Td>
      <Table.Td>
        <span className='text-sm text-gray-600 line-clamp-2'>{task.description || '-'}</span>
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-center gap-2'>
          <EditButton tooltip='Edit Task' onEdit={onEdit} />
          <DeleteButton tooltip='Delete Task' onDelete={onDelete} />
        </div>
      </Table.Td>
    </Table.Tr>
  );
}

export default function TimelineTemplateListView({
  projectTypeId,
  phases,
  refetchData,
}: TimelineTemplateListViewProps) {
  const [localPhases, setLocalPhases] = useState<PhaseWithTasks[]>([]);
  const [openPhaseIds, setOpenPhaseIds] = useState<Set<string>>(new Set());
  const [activePhase, setActivePhase] = useState<PhaseWithTasks | null>(null);
  const [activeTask, setActiveTask] = useState<MasterTaskItem | null>(null);

  const [selectedPhase, setSelectedPhase] = useState<PhaseWithTasks | null>(null);
  const [selectedTask, setSelectedTask] = useState<TMasterTask | null>(null);
  const [selectedPhaseIdForTask, setSelectedPhaseIdForTask] = useState<string | null>(null);
  const [getTaskById] = useLazyGetMasterTasksQuery();

  const [isOpenAddPhaseSidebar, { open: openAddPhaseSidebar, close: closeAddPhaseSidebar }] =
    useDisclosure(false);
  const [isOpenEditPhaseSidebar, { open: openEditPhaseSidebar, close: closeEditPhaseSidebar }] =
    useDisclosure(false);
  const [isOpenDeletePhaseModal, { open: openDeletePhaseModal, close: closeDeletePhaseModal }] =
    useDisclosure(false);
  const [isOpenAddTaskSidebar, { open: openAddTaskSidebar, close: closeAddTaskSidebar }] =
    useDisclosure(false);
  const [isOpenEditTaskSidebar, { open: openEditTaskSidebar, close: closeEditTaskSidebar }] =
    useDisclosure(false);
  const [isOpenDeleteTaskModal, { open: openDeleteTaskModal, close: closeDeleteTaskModal }] =
    useDisclosure(false);

  const [rearrangeMasterPhases] = useRearrangeMasterPhasesMutation();
  const [rearrangeMasterTasks] = useRearrangeMasterTasksMutation();
  const [removeMasterPhase, { isLoading: isRemovingPhase }] =
    useRemoveMasterPhaseFromProjectTypeMutation();
  const [removeMasterTask, { isLoading: isRemovingTask }] =
    useRemoveMasterTaskFromMasterPhaseMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor),
  );

  // Transform phases when data changes
  useEffect(() => {
    const transformed = transformPhases(phases);
    setLocalPhases(transformed);
    // Open first phase by default
    if (transformed.length > 0 && openPhaseIds.size === 0) {
      setOpenPhaseIds(new Set([transformed[0].id]));
    }
  }, [phases]);

  function handlePhaseToggle(phaseId: string) {
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

    const phaseItem = localPhases.find((p) => p.id === active.id);
    if (phaseItem) {
      setActivePhase(phaseItem);
      setActiveTask(null);
      return;
    }

    // Check if it's a task
    for (const phase of localPhases) {
      const task = phase.tasks.find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
        setActivePhase(null);
        return;
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActivePhase(null);
    setActiveTask(null);

    if (!active || !active.id || !over || !over.id) return;

    // Check if dragging a phase
    const draggedPhaseIndex = localPhases.findIndex((p) => p.id === active.id);
    if (draggedPhaseIndex !== -1) {
      const overPhaseIndex = localPhases.findIndex((p) => p.id === over.id);
      if (overPhaseIndex !== -1 && draggedPhaseIndex !== overPhaseIndex) {
        const newPhases = arrayMove(localPhases, draggedPhaseIndex, overPhaseIndex);
        setLocalPhases(newPhases);

        const phaseIds = newPhases.map((p) => p.id);
        rearrangeMasterPhases({ projectTypeId, masterPhases: phaseIds })
          .unwrap()
          .then(() => {
            toast.success('Phase order updated');
            refetchData();
          })
          .catch((error: { data: TErrorResponse }) => {
            setLocalPhases(transformPhases(phases));
            toast.error(error?.data?.message || 'Failed to update phase order');
          });
      }
      return;
    }

    // Handle task reordering within same phase
    for (const phase of localPhases) {
      const activeTaskIndex = phase.tasks.findIndex((t) => t.id === active.id);
      const overTaskIndex = phase.tasks.findIndex((t) => t.id === over.id);

      if (activeTaskIndex !== -1 && overTaskIndex !== -1 && activeTaskIndex !== overTaskIndex) {
        const newTasks = arrayMove(phase.tasks, activeTaskIndex, overTaskIndex);
        const newPhases = localPhases.map((p) =>
          p.id === phase.id ? { ...p, tasks: newTasks } : p,
        );
        setLocalPhases(newPhases);

        const taskIds = newTasks.map((t) => t.id);
        rearrangeMasterTasks({ projectTypeId, masterPhaseId: phase.id, masterTasks: taskIds })
          .unwrap()
          .then(() => {
            toast.success('Task order updated');
            refetchData();
          })
          .catch((error: { data: TErrorResponse }) => {
            setLocalPhases(transformPhases(phases));
            toast.error(error?.data?.message || 'Failed to update task order');
          });
        return;
      }
    }
  }

  function handleEditPhase(phase: PhaseWithTasks) {
    setSelectedPhase(phase);
    openEditPhaseSidebar();
  }

  function handleDeletePhaseClick(phase: PhaseWithTasks) {
    setSelectedPhase(phase);
    openDeletePhaseModal();
  }

  function handleDeletePhaseConfirm() {
    if (!selectedPhase?.id) return;
    removeMasterPhase({ projectTypeId, masterPhaseId: selectedPhase.id })
      .unwrap()
      .then(() => {
        toast.success('Phase removed from template successfully');
        closeDeletePhaseModal();
        refetchData();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Failed to remove phase from template');
      });
  }

  function handleAddTask(phaseId: string) {
    setSelectedPhaseIdForTask(phaseId);
    openAddTaskSidebar();
  }

  async function handleEditTask(task: MasterTaskItem, phaseId: string) {
    setSelectedPhaseIdForTask(phaseId);
    try {
      const result = await getTaskById({ id: task.id });
      if (result.data?.masterTasks?.[0]) {
        setSelectedTask(result.data.masterTasks[0]);
        openEditTaskSidebar();
      } else {
        toast.error('Task not found');
      }
    } catch (error) {
      toast.error('Unable to load task details');
      console.error('Error fetching task:', error);
    }
  }

  function handleDeleteTaskClick(task: MasterTaskItem, phaseId: string) {
    // Store just the id and name for deletion - we don't need full TMasterTask here
    setSelectedTask({ id: task.id, name: task.name } as TMasterTask);
    setSelectedPhaseIdForTask(phaseId);
    openDeleteTaskModal();
  }

  function handleDeleteTaskConfirm() {
    if (!selectedTask?.id || !selectedPhaseIdForTask) return;
    removeMasterTask({
      projectTypeId,
      masterPhaseId: selectedPhaseIdForTask,
      masterTaskId: selectedTask.id,
    })
      .unwrap()
      .then(() => {
        toast.success('Task removed from phase successfully');
        closeDeleteTaskModal();
        refetchData();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Failed to remove task from phase');
      });
  }

  const phaseIds = localPhases.map((p) => p.id);
  const allTaskIds = localPhases.flatMap((p) => p.tasks.map((t) => t.id));

  return (
    <div className='bg-gray-50 p-4'>
      <div className='mb-4 flex justify-end'>
        <Button
          onClick={openAddPhaseSidebar}
          radius='full'
          className='text-orange-400! bg-orange-50 hover:bg-orange-100'
          leftIcon={<IconPlus size={16} />}
        >
          Add New Phase
        </Button>
      </div>

      {localPhases.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-64 gap-4'>
          <p className='text-gray-500 text-center'>No phases found. Add a phase to get started.</p>
        </div>
      ) : (
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
              {localPhases.map((phase) => (
                <DraggablePhaseAccordion
                  key={phase.id}
                  phase={phase}
                  isOpen={openPhaseIds.has(phase.id)}
                  onToggle={() => handlePhaseToggle(phase.id)}
                  onEditPhase={handleEditPhase}
                  onDeletePhase={handleDeletePhaseClick}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTaskClick}
                  onAddTask={handleAddTask}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activePhase ? (
              <div className='bg-white border border-gray-200 rounded-lg p-4 shadow-lg min-w-[400px]'>
                <div className='font-semibold text-gray-900 mb-2'>{activePhase.name}</div>
                <div className='text-xs text-gray-500'>{activePhase.tasks.length} tasks</div>
              </div>
            ) : activeTask ? (
              <div className='bg-white border border-gray-200 rounded shadow-lg p-2 min-w-[300px]'>
                <div className='font-medium text-sm'>{activeTask.name}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add Phase Sidebar */}
      <AddEditMasterPhaseSidebar
        isOpen={isOpenAddPhaseSidebar}
        onClose={closeAddPhaseSidebar}
        mode='create'
        onSuccess={() => {
          refetchData();
          closeAddPhaseSidebar();
        }}
        projectTypeId={projectTypeId}
      />

      {/* Edit Phase Sidebar */}
      <AddEditMasterPhaseSidebar
        isOpen={isOpenEditPhaseSidebar}
        onClose={closeEditPhaseSidebar}
        mode='edit'
        phaseData={selectedPhase as any}
        onSuccess={() => {
          refetchData();
          closeEditPhaseSidebar();
        }}
        projectTypeId={projectTypeId}
      />

      {/* Delete Phase Modal */}
      <AlertModal
        isLoading={isRemovingPhase}
        title={`Remove ${selectedPhase?.name}?`}
        subtitle='This will remove the phase from this template'
        onClose={closeDeletePhaseModal}
        opened={isOpenDeletePhaseModal}
        onConfirm={handleDeletePhaseConfirm}
      />

      {/* Add Task Sidebar */}
      <AddMasterTaskSidebar
        isOpen={isOpenAddTaskSidebar}
        onClose={closeAddTaskSidebar}
        initialValues={
          selectedPhaseIdForTask
            ? {
                name: '',
                masterPhaseId: [selectedPhaseIdForTask],
                priority: 'MEDIUM',
                subTasks: [],
              }
            : null
        }
        defaultPhaseData={
          selectedPhaseIdForTask && selectedPhase
            ? [{ label: selectedPhase.name, value: selectedPhaseIdForTask }]
            : null
        }
        onCreated={() => {
          refetchData();
          closeAddTaskSidebar();
        }}
        projectTypeId={projectTypeId}
      />

      {/* Edit Task Sidebar */}
      <EditMasterTaskSidebar
        isOpen={isOpenEditTaskSidebar}
        onClose={() => {
          closeEditTaskSidebar();
          refetchData();
        }}
        taskData={selectedTask}
        projectTypeId={projectTypeId}
      />

      {/* Delete Task Modal */}
      <AlertModal
        isLoading={isRemovingTask}
        title={`Remove ${selectedTask?.name}?`}
        subtitle='This will remove the task from this phase'
        onClose={closeDeleteTaskModal}
        opened={isOpenDeleteTaskModal}
        onConfirm={handleDeleteTaskConfirm}
      />
    </div>
  );
}
