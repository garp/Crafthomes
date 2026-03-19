import { useState } from 'react';
import { Modal, Button as MantineButton, Checkbox, TextInput } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { useGetProjectTasksQuery } from '../../../../store/services/task/taskSlice';
import type { TTask } from '../../../../store/types/task.types';
import { Button } from '../../../../components';
import Spinner from '../../../../components/common/loaders/Spinner';

type TaskSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAddTasks: (tasks: { originalTaskId: string; taskTitle: string }[]) => void;
  onCreateTask: () => void;
};

export default function TaskSelectorModal({
  isOpen,
  onClose,
  projectId,
  onAddTasks,
  onCreateTask,
}: TaskSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const { data: taskData, isFetching } = useGetProjectTasksQuery(
    {
      projectId,
      pageLimit: '50',
      search: search || undefined,
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
    onClose();
    onCreateTask();
  };

  return (
    <Modal opened={isOpen} onClose={onClose} title='Add Tasks to Site Visit' size='lg' padding='lg'>
      <div className='space-y-4'>
        {/* Search and Create Task Button */}
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
            Create Task
          </Button>
        </div>

        {/* Task List */}
        <div className='border rounded-lg max-h-[400px] overflow-y-auto'>
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

        {/* Footer */}
        <div className='flex justify-end gap-3 pt-2'>
          <MantineButton variant='subtle' onClick={onClose}>
            Cancel
          </MantineButton>
          <Button onClick={handleAddSelected} disabled={selectedTaskIds.length === 0} radius='md'>
            Add {selectedTaskIds.length > 0 && `(${selectedTaskIds.length})`} Task
            {selectedTaskIds.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
