import { useState, useMemo } from 'react';
import { Button as MantineButton, Checkbox, TextInput } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { useGetProjectTasksQuery } from '../../../../store/services/task/taskSlice';
import { useGetProjectTimelineQuery } from '../../../../store/services/projectTimeline/projectTimelineSlice';
import { useGetPhasesQuery } from '../../../../store/services/phase/phaseSlice';
import type { TTask } from '../../../../store/types/task.types';
import { Button } from '../../../../components';
import SidebarModal from '../../../../components/base/SidebarModal';
import Spinner from '../../../../components/common/loaders/Spinner';
import FormSelect from '../../../../components/base/FormSelect';

type TaskSelectorSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAddTasks: (tasks: { originalTaskId: string; taskTitle: string }[]) => void;
  onCreateTask: () => void;
};

export default function TaskSelectorSidebar({
  isOpen,
  onClose,
  projectId,
  onAddTasks,
  onCreateTask,
}: TaskSelectorSidebarProps) {
  const [search, setSearch] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [timelineId, setTimelineId] = useState<string | null>(null);
  const [phaseId, setPhaseId] = useState<string | null>(null);
  const [assignedToMe, setAssignedToMe] = useState(false);

  const { data: timelineData } = useGetProjectTimelineQuery(
    { projectId, pageLimit: '100' },
    { skip: !isOpen || !projectId },
  );
  const { data: phasesData } = useGetPhasesQuery(
    {
      projectId,
      timelineId: timelineId || undefined,
      pageLimit: '100',
    },
    { skip: !isOpen || !projectId },
  );

  const timelineOptions = useMemo(
    () => (timelineData?.timelines ?? []).map((t) => ({ label: t.name, value: t.id })),
    [timelineData?.timelines],
  );
  const phaseOptions = useMemo(
    () => (phasesData?.phases ?? []).map((p) => ({ label: p.name, value: p.id })),
    [phasesData?.phases],
  );

  const { data: taskData, isFetching } = useGetProjectTasksQuery(
    {
      projectId,
      pageLimit: '50',
      search: search || undefined,
      timelineId: timelineId || undefined,
      phaseId: phaseId || undefined,
      assignedToMe: assignedToMe || undefined,
    },
    { skip: !isOpen },
  );

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const handleAddSelected = () => {
    const tasksToAdd = taskData?.tasks
      .filter((task: TTask) => selectedTaskIds.includes(task.id))
      .map((task: TTask) => ({
        originalTaskId: task.id,
        taskTitle: task.name,
      }));
    if (tasksToAdd && tasksToAdd.length > 0) {
      onAddTasks(tasksToAdd);
      setSelectedTaskIds([]);
      onClose();
    }
  };

  const handleCreateTaskClick = () => {
    onCreateTask();
  };

  const handleTimelineChange = (value: string | null) => {
    setTimelineId(value ?? null);
    setPhaseId(null);
  };

  return (
    <SidebarModal opened={isOpen} onClose={onClose} heading='Create Tasks' size='480px'>
      <div className='flex flex-col h-full'>
        <p className='text-sm text-gray-500 px-6 pt-2 pb-4'>
          Create new tasks or add from existing to include in this visit.
        </p>
        <div className='px-6 space-y-4 flex-1 flex flex-col min-h-0'>
          <div className='flex gap-3'>
            <TextInput
              placeholder='Search tasks...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftSection={<IconSearch className='size-4' />}
              className='flex-1'
            />
            <Button
              onClick={handleCreateTaskClick}
              variant='outline'
              radius='md'
              className='whitespace-nowrap'
            >
              <IconPlus className='size-4 mr-1' />
              Create task
            </Button>
          </div>

          <div className='flex flex-wrap items-end gap-3'>
            <div className='flex-1 min-w-[140px]'>
              <FormSelect
                label='Timeline'
                placeholder='All timelines'
                value={timelineId ?? ''}
                onChange={handleTimelineChange}
                options={[{ label: 'All timelines', value: '' }, ...timelineOptions]}
                clearable
                className='w-full'
              />
            </div>
            <div className='flex-1 min-w-[140px]'>
              <FormSelect
                label='Phase'
                placeholder='All phases'
                value={phaseId ?? ''}
                onChange={(value) => setPhaseId(value ?? null)}
                options={[{ label: 'All phases', value: '' }, ...phaseOptions]}
                clearable
                className='w-full'
              />
            </div>
            <div className='shrink-0 pb-1'>
              <Checkbox
                label='Assigned to me'
                checked={assignedToMe}
                onChange={(e) => setAssignedToMe(e.currentTarget.checked)}
                size='sm'
                color='dark.6'
                iconColor='white'
                classNames={{
                  label: 'text-sm text-gray-700',
                  input: 'cursor-pointer border-gray-300',
                }}
              />
            </div>
          </div>

          <div className='text-sm font-medium text-gray-700'>Add from existing task</div>

          <div className='border rounded-lg flex-1 min-h-0 overflow-y-auto'>
            {isFetching ? (
              <div className='p-8 flex items-center justify-center'>
                <Spinner className='size-6 text-gray-700' />
              </div>
            ) : taskData?.tasks && taskData.tasks.length > 0 ? (
              <div className='divide-y'>
                {taskData.tasks
                  .filter(
                    (task: TTask) =>
                      task.taskStatus === 'PENDING' ||
                      task.taskStatus === 'IN_PROGRESS' ||
                      !task.taskStatus,
                  )
                  .map((task: TTask) => (
                    <div
                      key={task.id}
                      className='p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3'
                      onClick={() => handleToggleTask(task.id)}
                    >
                      <Checkbox
                        color='dark'
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleToggleTask(task.id)}
                        className='mt-0.5'
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm'>{task.name}</p>
                        {task.description && (
                          <p className='text-xs text-gray-500 truncate'>{task.description}</p>
                        )}
                        <div className='flex gap-2 mt-1'>
                          {task.taskStatus && (
                            <span className='text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded'>
                              {task.taskStatus}
                            </span>
                          )}
                          {task.priority && (
                            <span className='text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded'>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className='p-8 text-center text-gray-500'>
                <p>No tasks found</p>
                <p className='text-sm mt-1'>Create a new task to get started</p>
              </div>
            )}
          </div>

          <div className='flex justify-end gap-3 pt-4 pb-6 border-t'>
            <MantineButton variant='subtle' onClick={onClose}>
              Cancel
            </MantineButton>
            <Button onClick={handleAddSelected} disabled={selectedTaskIds.length === 0} radius='md'>
              Add {selectedTaskIds.length > 0 && `(${selectedTaskIds.length})`} Task
              {selectedTaskIds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </SidebarModal>
  );
}
