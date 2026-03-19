import { PageTransition } from '../../components/common';
import { TaskHeader } from './components/TaskHeader';
import { TaskCard } from './components/TaskCard';
import {
  useApproveTaskMutation,
  useGetInfiniteTasksInfiniteQuery,
  useDeleteTaskMutation,
  useMarkTaskCompleteMutation,
} from '../../store/services/task/taskSlice';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import { useEffect, useRef, useState } from 'react';
import { TaskSkelton } from '../../components/base/Skeletons';
import EditTaskSidebar from '../../components/common/Task/EditTaskSidebar';
import { useDisclosure } from '@mantine/hooks';
import type { TTask } from '../../store/types/task.types';
import AlertModal from '../../components/base/AlertModal';
import ModalWrapper from '../../components/base/ModalWrapper';
import { Button } from '../../components/base';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';
import { isTaskCompleted } from '../../utils/helper';
import { triggerConfetti } from '../../utils/confetti';

export const Tasks = () => {
  const { getParam } = useUrlSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filterParams = {
    search: getParam('query') || '',
    searchText: getParam('globalQuery') || '',
    taskStatus: getParam('status') || '',
    projectId: getParam('projectId') || '',
    assignedToMe: getParam('assignedToMe') === 'true',
    approvalPending: getParam('approvalPending') === 'true',
  };
  const prevFilterParamsRef = useRef(filterParams);
  const [isFilterChanging, setIsFilterChanging] = useState(false);

  const {
    data: task,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useGetInfiniteTasksInfiniteQuery({
    search: filterParams.search,
    searchText: filterParams.searchText,
    taskStatus: filterParams.taskStatus,
    pageLimit: '10',
    projectId: filterParams.projectId,
    assignedToMe: filterParams.assignedToMe ? true : undefined,
    approvalPending: filterParams.approvalPending ? true : undefined,
  });

  // Show skeleton when filters change (e.g. "Assigned to me") until new data loads
  useEffect(() => {
    const prev = prevFilterParamsRef.current;
    const changed =
      prev.assignedToMe !== filterParams.assignedToMe ||
      prev.approvalPending !== filterParams.approvalPending ||
      prev.projectId !== filterParams.projectId ||
      prev.taskStatus !== filterParams.taskStatus ||
      prev.search !== filterParams.search ||
      prev.searchText !== filterParams.searchText;
    if (changed) {
      prevFilterParamsRef.current = filterParams;
      setIsFilterChanging(true);
    }
  }, [
    filterParams.assignedToMe,
    filterParams.approvalPending,
    filterParams.projectId,
    filterParams.taskStatus,
    filterParams.search,
    filterParams.searchText,
  ]);

  useEffect(() => {
    if (!isFetching && isFilterChanging) {
      setIsFilterChanging(false);
    }
  }, [isFetching, isFilterChanging]);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1 },
    );
    if (!loadMoreRef.current) return;
    const target = loadMoreRef.current;
    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const [isOpenEditTaskSidebar, { open: openEditTaskSidebar, close: closeEditTaskSidebar }] =
    useDisclosure(false);
  const [isOpenDeleteTaskModal, { open: openDeleteTaskModal, close: closeDeleteTaskModal }] =
    useDisclosure(false);
  const [isOpenApproveTaskModal, { open: openApproveTaskModal, close: closeApproveTaskModal }] =
    useDisclosure(false);
  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [markTaskComplete, { isLoading: isMarkingComplete }] = useMarkTaskCompleteMutation();
  const [approveTask, { isLoading: isApprovingTask }] = useApproveTaskMutation();
  const { setParams } = useUrlSearchParams();
  const [selectedTask, setSelectedTask] = useState<TTask | null>(null);

  const taskIdFromUrl = getParam('taskId');

  // Sync URL taskId to sidebar: when taskId is in URL, open sidebar and set selected task so EditTaskSidebar can fetch by id
  useEffect(() => {
    if (!taskIdFromUrl) return;
    if (selectedTask?.id === taskIdFromUrl) return;
    setSelectedTask({ id: taskIdFromUrl } as TTask);
    openEditTaskSidebar();
  }, [taskIdFromUrl]);

  function handleCloseEditSidebar() {
    closeEditTaskSidebar();
    setSelectedTask(null);
  }

  function handleTaskClick(task: TTask) {
    setSelectedTask(task);
    openEditTaskSidebar();
    setParams('taskId', task?.id);
  }

  function handleDeleteClick(task: TTask) {
    setSelectedTask(task);
    openDeleteTaskModal();
  }

  function handleDeleteTask() {
    if (!selectedTask?.id) {
      toast.error('Unable to delete task');
      return;
    }
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
    console.log('🚀 ~ handleMarkComplete ~ task:', task);
    const isCompleted = isTaskCompleted(task?.status, task?.taskStatus);
    markTaskComplete({ id: task.id })
      .unwrap()
      .then(() => {
        if (!isCompleted) {
          // Trigger confetti only when marking as complete (not incomplete)
          triggerConfetti();
        }
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
        console.error('Error marking task as complete:', error);
      });
  }

  function handleApproveTask(task: TTask) {
    setSelectedTask(task);
    openApproveTaskModal();
  }

  function handleApproveConfirmed() {
    if (!selectedTask?.id) {
      toast.error('Unable to approve task');
      return;
    }

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

  // console.log({ task });
  return (
    <>
      <PageTransition skipAnimation={!!taskIdFromUrl}>
        <div className='space-y-6'>
          <TaskHeader />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-8'>
            {/* Show skeleton on initial load (no data) or when filters change (e.g. Assigned to me) until new data loads. */}
            {isFetching && !isFetchingNextPage && (!task?.pages?.length || isFilterChanging) ? (
              <TaskSkelton />
            ) : task?.pages?.[0]?.tasks?.length === 0 ? (
              <p className='text-center col-span-full font-medium text-text-secondary'>
                No Tasks found
              </p>
            ) : (
              task?.pages?.flatMap((page) =>
                page.tasks?.map((task) => (
                  <div key={task?.id} onClick={() => handleTaskClick(task)}>
                    <TaskCard
                      taskData={task}
                      onDelete={handleDeleteClick}
                      onMarkComplete={handleMarkComplete}
                      onApprove={handleApproveTask}
                      isMarkingComplete={isMarkingComplete || isApprovingTask}
                    />
                  </div>
                )),
              )
            )}
          </div>
          {/* Loader target */}
          {/* <div ref={loadMoreRef} className='h-10 flex items-center justify-center'>
            {isFetchingNextPage && <Loader />}
          </div> */}
        </div>
      </PageTransition>
      <EditTaskSidebar
        task={selectedTask}
        isOpen={isOpenEditTaskSidebar}
        onClose={handleCloseEditSidebar}
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
};
