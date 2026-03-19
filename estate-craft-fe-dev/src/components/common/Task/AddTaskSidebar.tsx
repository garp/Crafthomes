import { IconChevronRight, IconTrash, IconCircleCheck } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { type TCreateTaskFormData } from '../../../validators/task';
import type { TErrorResponse } from '../../../store/types/common.types';
import { useCreateTaskMutation } from '../../../store/services/task/taskSlice';
import type {
  TAddTaskSidebarProps,
  TOnSubmitArgs,
  TSubTaskProps,
} from '../../../types/common.types';

import { useDisclosure } from '@mantine/hooks';
import AddSubTaskSidebar from './AddSubTaskSidebar';
import { ADD_TASK_INITIAL_VALUES } from '../../../constants/common';
import SidebarModal from '../../base/SidebarModal';
import TaskForm from './TaskForm';
import IconButton from '../../base/button/IconButton';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { getUser } from '../../../utils/auth';
import {
  useMarkSubTaskCompleteMutation,
  useGetSubTasksQuery,
} from '../../../store/services/subtask/subtaskSlice';
import { isTaskCompleted } from '../../../utils/helper';
import { ActionButton } from '../../base/button/ActionButton';

// const UserSelector = lazy(() => import('../../users/UserNameFilter'));
// const TaskSelector = lazy(() => import('../selectors/TaskSelector'));
// const PhaseSelector = lazy(() => import('../selectors/PhaseSelector'));
// const PhaseSelector = lazy(() => import('../selectors/PhaseSelector'));

// const [uploadFiles, { isLoading: isUploadingFiles }] = useUploadFilesMutation();
// const [deleteFile, { isLoading: isDeletingFile }] = useDeleteFileMutation();
const ADD_TASK_SIDEBAR_Z_INDEX = 300;

export const AddTaskSidebar = ({
  isOpen,
  onClose,
  phaseId,
  fixedProjectId,
  stackOnTop,
  onTaskCreated,
}: TAddTaskSidebarProps) => {
  const { deleteParams } = useUrlSearchParams();
  const currentUser = getUser();
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const initialValues = {
    ...ADD_TASK_INITIAL_VALUES,
    phaseId: phaseId ?? '',
    projectId: fixedProjectId ?? '',
    assignedBy: currentUser?.id || '',
  };
  // console.log({ phaseId, phaseName });
  // const formik = useFormik<TCreateTaskFormData>({
  //   initialValues: {
  //     ...INITIAL_VALUES,

  //     subTasks: [],
  //   },
  //   validationSchema: addTaskSchema,
  //   onSubmit: async (values, { resetForm }) => {
  //     // Handle Submit
  //     const uploadedFiles = attachments?.map((att) => ({ name: att?.name, url: att?.url })) || [];
  //     postTask({ ...values, attachment: { files: uploadedFiles } }, resetForm);
  //   },
  // });

  // function handleAttachmentChange(
  //   e: React.ChangeEvent<HTMLInputElement>,
  //   setFieldValue: (field: string, value: any) => void,
  //   values: TCreateTaskFormData,
  // ) {
  //   const files = e.target.files;
  //   if (!files) return;

  //   if (files?.length > 5 || (values.attachment?.length || 0) + files.length > 5) {
  //     toast.error('Maximum 5 files allowed');
  //     return;
  //   }

  //   const formData = new FormData();
  //   for (const file of files) {
  //     if (file.size > MAX_FILE_SIZE) {
  //       toast.error('File size must be less than 10 MB');
  //       return;
  //     }
  //     formData.append('files', file);
  //   }
  //   formData.append('folder', 'estatecraft-task-attachments');

  //   uploadFiles(formData)
  //     .unwrap()
  //     .then((res) => {
  //       const uploadedFiles = res?.data?.files;
  //       setFieldValue('attachment', [...(values.attachment || []), ...uploadedFiles]);
  //     });
  // }

  // function removeAttachment(
  //   attachment: TAttachment,
  //   setFieldValue: (field: string, value: any) => void,
  //   values: TCreateTaskFormData,
  // ) {
  //   deleteFile({ key: attachment?.key })
  //     .unwrap()
  //     .then(() => {
  //       // setAttachments((prev) => prev.filter((att) => att.key !== attachment?.key));
  //     })
  //     .catch((error: { data: TErrorResponse }) => {
  //       if (error?.data?.message) {
  //         toast.error(error?.data?.message);
  //       } else toast.error('Unable to delete file');
  //       console.log('Error in deleting file-', error);
  //     });
  //   setFieldValue(
  //     'attachment',
  //     values?.attachment?.filter((att) => att.key !== attachment?.key),
  //   );
  // }

  function handleSubmit({ data, resetForm }: TOnSubmitArgs<TCreateTaskFormData>) {
    // Exclude subTasks from create payload
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subTasks, ...dataWithoutSubTasks } = data;
    console.log({ dataWithoutSubTasks });

    // Convert duration to string if it exists
    const payload = { ...dataWithoutSubTasks };
    if (typeof payload.duration === 'number') {
      payload.duration = String(payload.duration) as any;
    }
    // Omit phaseId when empty so backend treats it as optional
    if (payload.phaseId === '' || payload.phaseId == null) {
      delete payload.phaseId;
    }

    if (!payload.projectId) {
      toast.error('Project is required');
      return;
    }

    createTask(payload)
      .unwrap()
      .then(
        (
          result:
            | { data?: import('../../../store/types/task.types').TTask }
            | import('../../../store/types/task.types').TTask,
        ) => {
          const task =
            result && typeof (result as any).data !== 'undefined'
              ? (result as { data: import('../../../store/types/task.types').TTask }).data
              : (result as import('../../../store/types/task.types').TTask);
          if (task) onTaskCreated?.(task);
          toast.success('Task created successfully');
          resetForm();
          handleCloseSidebar();
        },
      )
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to create Task');
        console.log('Error in creating Task:', error);
      });
  }

  function handleCloseSidebar() {
    onClose();
    deleteParams(['taskId']);
  }
  return (
    <SidebarModal
      heading='Add Task'
      opened={isOpen}
      onClose={handleCloseSidebar}
      size='600px'
      zIndex={stackOnTop ? ADD_TASK_SIDEBAR_Z_INDEX : undefined}
    >
      <TaskForm
        disabled={isCreatingTask}
        initialValues={initialValues}
        mode='create'
        onSubmit={handleSubmit}
        onClose={onClose}
        fixedProjectId={fixedProjectId}
      />
    </SidebarModal>
  );
};
/////////////////SubTask///////////////
export const SubTask = ({
  subtask,
  index,
  removeSubTask,
  onDelete,
  taskDisabled = false,
}: TSubTaskProps) => {
  const [
    isOpenedAddSubTaskSidebar,
    { open: openAddSubTaskSidebar, close: closeAddSubTaskSidebar },
  ] = useDisclosure(false);
  const { getParam } = useUrlSearchParams();
  const taskId = getParam('taskId');
  const [markSubTaskComplete, { isLoading: isMarkingComplete }] = useMarkSubTaskCompleteMutation();
  const { refetch: refetchSubTasks } = useGetSubTasksQuery(
    { parentTaskId: taskId || '' },
    { skip: !taskId },
  );

  // Use subtask object if provided, otherwise get from form values
  const subtaskName = subtask?.name || 'Untitled Checklist';
  const subtaskId = subtask?.id;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    } else if (removeSubTask && index !== undefined) {
      removeSubTask(index);
    }
  };

  const handleMarkComplete = async () => {
    if (!subtaskId) return;
    const isCompleted = isTaskCompleted(subtask?.taskStatus, subtask?.status);

    try {
      await markSubTaskComplete({ id: subtaskId }).unwrap();
      toast.success(
        isCompleted ? 'Checklist marked as incomplete' : 'Checklist marked as complete',
      );
      if (taskId) {
        refetchSubTasks();
      }
    } catch (error: any) {
      console.error('Error toggling subtask completion:', error);
      const errorMessage =
        (error as { data?: TErrorResponse })?.data?.message ||
        (isCompleted
          ? 'Failed to mark checklist as incomplete'
          : 'Failed to mark checklist as complete');
      toast.error(errorMessage);
    }
  };

  return (
    <div className=''>
      {/* Subtask Item - Clickable to edit */}
      <div
        className={`flex gap-2 items-center p-3 border border-gray-200 rounded-lg transition-colors ${
          taskDisabled
            ? 'cursor-not-allowed bg-gray-50 opacity-70'
            : 'hover:bg-gray-50 cursor-pointer'
        }`}
        onClick={() => {
          if (!taskDisabled) {
            openAddSubTaskSidebar();
          }
        }}
      >
        <div className='flex-1 flex items-center gap-2'>
          <IconChevronRight className='size-4 text-gray-400' />
          <span className='text-sm font-medium text-gray-700'>{subtaskName}</span>
        </div>
        <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
          {subtaskId && (
            <ActionButton
              tooltip={
                isTaskCompleted(subtask?.taskStatus, subtask?.status)
                  ? 'Mark as Incomplete'
                  : 'Mark as Complete'
              }
              icon={
                isTaskCompleted(subtask?.taskStatus, subtask?.status) ? (
                  <IconCircleCheck className='size-5 fill-green-700 text-green-100' />
                ) : (
                  <IconCircleCheck className='size-5' />
                )
              }
              onClick={handleMarkComplete}
              disabled={taskDisabled || isMarkingComplete}
            />
          )}
          {!taskDisabled && (
            <IconButton type='button' onClick={handleDelete}>
              <IconTrash className='text-text-subHeading size-5' />
            </IconButton>
          )}
        </div>
      </div>
      {!taskDisabled && (
        <AddSubTaskSidebar
          index={index}
          subtaskId={subtaskId}
          subtask={subtask}
          isOpen={isOpenedAddSubTaskSidebar}
          onClose={closeAddSubTaskSidebar}
        />
      )}
    </div>
  );
};
