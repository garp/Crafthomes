import { useDisclosure } from '@mantine/hooks';
import { TaskCard } from '../../../tasks/components/TaskCard';
import EditTaskSidebar from '../../../../components/common/Task/EditTaskSidebar';
import AlertModal from '../../../../components/base/AlertModal';
import ModalWrapper from '../../../../components/base/ModalWrapper';
import { Button } from '../../../../components/base';
import CustomPagination from '../../../../components/base/CustomPagination';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
import {
  useApproveTaskMutation,
  useDeleteTaskMutation,
  useMarkTaskCompleteMutation,
} from '../../../../store/services/task/taskSlice';
import type { TTask } from '../../../../store/types/task.types';
import { useState, useEffect } from 'react';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import { getTotalPages, isTaskCompleted } from '../../../../utils/helper';

export default function ProjectTasksCardView({
  tasks,
  totalCount,
}: {
  tasks: TTask[];
  totalCount?: number;
}) {
  const [selectedTask, setSelectedTask] = useState<TTask | null>(null);
  const [isOpenEditTaskSidebar, { open: openEditTaskSidebar, close: closeEditTaskSidebar }] =
    useDisclosure(false);
  const [isOpenDeleteTaskModal, { open: openDeleteTaskModal, close: closeDeleteTaskModal }] =
    useDisclosure(false);
  const [isOpenApproveTaskModal, { open: openApproveTaskModal, close: closeApproveTaskModal }] =
    useDisclosure(false);
  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [markTaskComplete, { isLoading: isMarkingComplete }] = useMarkTaskCompleteMutation();
  const [approveTask, { isLoading: isApprovingTask }] = useApproveTaskMutation();
  const { setParams, getParam } = useUrlSearchParams();

  const taskIdFromUrl = getParam('taskId');

  // Sync URL taskId to sidebar: when taskId is in URL, open sidebar so EditTaskSidebar can fetch by id (works even if task is not on current page)
  useEffect(() => {
    if (!taskIdFromUrl) return;
    if (selectedTask?.id === taskIdFromUrl) return;
    setSelectedTask({ id: taskIdFromUrl } as TTask);
    openEditTaskSidebar();
  }, [taskIdFromUrl]);

  function handleTaskClick(task: TTask) {
    setSelectedTask(task);
    openEditTaskSidebar();
    if (task?.id) setParams('taskId', task.id);
  }

  function handleDeleteClick(task: TTask) {
    setSelectedTask(task);
    openDeleteTaskModal();
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

  function handleMarkComplete(task: TTask) {
    const isCompleted = isTaskCompleted(task?.status, task?.taskStatus);
    markTaskComplete({ id: task.id })
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

  function handleApproveTask(task: TTask) {
    setSelectedTask(task);
    openApproveTaskModal();
  }

  function handleApproveConfirmed() {
    if (!selectedTask?.id) return;

    approveTask({ id: selectedTask.id })
      .unwrap()
      .then(() => {
        toast.success('Task approved successfully');
        closeApproveTaskModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Unable to approve task');
      });
  }

  function handleViewTaskBeforeApprove() {
    if (!selectedTask) return;
    closeApproveTaskModal();
    handleTaskClick(selectedTask);
  }

  const totalPages = getTotalPages(totalCount, 10);

  return (
    <>
      {tasks.length === 0 ? (
        <div className='mt-6 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-text-subHeading'>
          No tasks found
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-8 mt-6'>
          {tasks?.map((task) => (
            <div key={task.id} onClick={() => handleTaskClick(task)} className='cursor-pointer'>
              <TaskCard
                taskData={task}
                onDelete={() => handleDeleteClick(task)}
                onMarkComplete={() => handleMarkComplete(task)}
                onApprove={() => handleApproveTask(task)}
                isMarkingComplete={isMarkingComplete || isApprovingTask}
              />
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && <CustomPagination total={totalPages} className='mt-6' />}
      <EditTaskSidebar
        isOpen={isOpenEditTaskSidebar}
        onClose={closeEditTaskSidebar}
        task={selectedTask}
      />
      <AlertModal
        title={`Delete ${selectedTask?.name}?`}
        subtitle="This action can't be undone"
        onClose={closeDeleteTaskModal}
        onConfirm={handleDeleteTask}
        opened={isOpenDeleteTaskModal}
        isLoading={isDeletingTask}
      />
      <ModalWrapper
        opened={isOpenApproveTaskModal}
        onClose={closeApproveTaskModal}
        title='Approve Task?'
        centered
      >
        <p className='font-medium text-text-subHeading'>
          Do you want to approve this task? After approval, you cannot edit this task.
        </p>
        <div className='flex flex-wrap justify-end gap-3 mt-8'>
          <Button variant='outline' onClick={closeApproveTaskModal} disabled={isApprovingTask}>
            Cancel
          </Button>
          <Button
            variant='outline'
            onClick={handleViewTaskBeforeApprove}
            disabled={isApprovingTask}
          >
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
