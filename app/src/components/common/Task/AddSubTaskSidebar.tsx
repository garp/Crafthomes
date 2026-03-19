import { Suspense, useMemo } from 'react';
import { Form, Formik } from 'formik';
import type { TAddSubTaskSidebarProps } from '../../../types/common.types';
import { baseTaskSchema, type TCreateSubTaskFormData } from '../../../validators/task';

import PhaseSelector from '../selectors/PhaseSelector2';
import TaskSelector from '../selectors/TaskSelector';
import UserSelector from '../selectors/UserSelector';
import MembersCombobox from '../combobox/MembersCombobox';
import FormInput from '../../base/FormInput';
import DescriptionField from './DescriptionField';
import { FormFieldSkeleton } from '../../base/Skeletons';
import FormLabel from '../../base/FormLabel';
import FormDate from '../../base/FormDate';
import FormSelect from '../../base/FormSelect';
import IconButton from '../../base/button/IconButton';
import { toast } from 'react-toastify';
import { IconArrowLeft, IconCheck, IconCircleCheck } from '@tabler/icons-react';
import DrawerModal from '../../base/DrawerModal';
import { priorityOptions } from '../../../constants/common';
import { Button } from '../../base';
import {
  useUpdateSubTaskMutation,
  useGetSubTasksQuery,
  useMarkSubTaskCompleteMutation,
} from '../../../store/services/subtask/subtaskSlice';
import { useGetTaskByIdQuery } from '../../../store/services/task/taskSlice';
import FormAttachment from '../../base/FormAttachment';
import { useAppSelector } from '../../../store/hooks';
import { removeAttachment } from '../../../store/services/commentAttachments/comments';
import { useDispatch } from 'react-redux';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import type { TErrorResponse } from '../../../store/types/common.types';
import { isTaskCompleted } from '../../../utils/helper';

export default function AddSubTaskSidebar({
  isOpen,
  onClose,
  index,
  subtaskId,
  subtask: subtaskData,
}: TAddSubTaskSidebarProps) {
  const dispatch = useDispatch();
  const subtaskAttachments = useAppSelector((state) => state.commentAttachments.attachments);
  const [updateSubTask, { isLoading: isUpdatingSubTask }] = useUpdateSubTaskMutation();
  const [markSubTaskComplete, { isLoading: isMarkingComplete }] = useMarkSubTaskCompleteMutation();
  const { getParam } = useUrlSearchParams();
  const taskId = getParam('taskId');

  // Fetch parent task to get assignee and assignedBy for auto-assignment
  const { data: parentTaskData } = useGetTaskByIdQuery(
    { id: taskId || '' },
    { skip: !taskId || !!subtaskData }, // Only fetch if creating new subtask (no subtaskData)
  );

  // Get refetch function for subtasks list
  const { refetch: refetchSubTasks } = useGetSubTasksQuery(
    { parentTaskId: taskId || '' },
    { skip: !taskId },
  );

  const disabled = isUpdatingSubTask || isMarkingComplete;

  const handleMarkComplete = async () => {
    if (!subtaskId) return;
    const isCompleted = isTaskCompleted(subtaskData?.taskStatus, subtaskData?.status);

    try {
      await markSubTaskComplete({ id: subtaskId }).unwrap();
      toast.success(
        isCompleted ? 'Checklist marked as incomplete' : 'Checklist marked as complete',
      );
      // Refetch subtasks to get updated data
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

  // Map prop-drilled subtask data to form initial values
  const initialValues: TCreateSubTaskFormData = useMemo(() => {
    // CREATE MODE: Auto-assign from parent task ONLY when creating a new subtask
    if (!subtaskData) {
      // Helper to get assignee IDs from parent task (for auto-assignment)
      const getParentAssigneeIds = () => {
        if (!parentTaskData) return [];

        // Priority 1: Use TaskAssignee if available
        if (
          parentTaskData?.TaskAssignee &&
          Array.isArray(parentTaskData.TaskAssignee) &&
          parentTaskData.TaskAssignee.length > 0
        ) {
          return parentTaskData.TaskAssignee.filter((ta) => ta?.User?.id)
            .map((ta) => ta?.User?.id)
            .filter((id): id is string => typeof id === 'string');
        }

        // Priority 2: Fallback to assigneeUser
        if (!parentTaskData?.assigneeUser) return [];
        if (Array.isArray(parentTaskData.assigneeUser)) {
          return parentTaskData.assigneeUser.filter((u) => u?.id).map((u) => u.id);
        }
        return parentTaskData.assigneeUser?.id ? [parentTaskData.assigneeUser.id] : [];
      };

      // Auto-assign from parent task (NOT from predecessor tasks)
      // IMPORTANT: This only happens when CREATING a new subtask, not when editing
      // Subtasks inherit assignment from their parent task only
      // Predecessor tasks are separate and only affect scheduling/blocking logic
      const parentAssignee = getParentAssigneeIds();
      const parentAssignedBy = parentTaskData?.assignedByUser?.id || '';

      return {
        name: '',
        description: '',
        plannedStart: undefined,
        plannedEnd: undefined,
        predecessorTaskIds: [],
        assignee: parentAssignee, // Auto-assign from parent task only (CREATE mode)
        assignedBy: parentAssignedBy, // Auto-assign from parent task only (CREATE mode)
        priority: '',
        phaseId: '',
        attachments: [],
      };
    }

    // EDIT MODE: Use existing subtask's assignment values (do NOT auto-assign from parent)

    // Helper to get assignee IDs from assigneeUser (can be null, object, or array)
    const getAssigneeIds = (assigneeUser: any) => {
      if (!assigneeUser) return [];
      if (Array.isArray(assigneeUser)) {
        return assigneeUser.map((u: any) => u?.id).filter(Boolean);
      }
      return assigneeUser?.id ? [assigneeUser.id] : [];
    };

    return {
      name: subtaskData?.name || '',
      description: subtaskData?.description || '',
      plannedStart: subtaskData?.plannedStart
        ? subtaskData.plannedStart instanceof Date
          ? subtaskData.plannedStart
          : new Date(subtaskData.plannedStart)
        : undefined,
      plannedEnd: subtaskData?.plannedEnd
        ? subtaskData.plannedEnd instanceof Date
          ? subtaskData.plannedEnd
          : new Date(subtaskData.plannedEnd)
        : undefined,
      predecessorTaskIds: (() => {
        // Handle multiple predecessor tasks if API returns an array
        const predecessorTasks = (subtaskData as any)?.predecessorTasks;
        if (Array.isArray(predecessorTasks) && predecessorTasks.length > 0) {
          return predecessorTasks
            .map((task: any) => task?.id)
            .filter((id: any): id is string => typeof id === 'string');
        }
        // Fallback to single predecessorTask
        if (subtaskData?.predecessorTask?.id) {
          return [subtaskData.predecessorTask.id];
        }
        // Also check predecessorTaskId as a fallback
        if (subtaskData?.predecessorTaskId) {
          return [subtaskData.predecessorTaskId];
        }
        return [];
      })(),
      assignee: getAssigneeIds(subtaskData?.assigneeUser),
      assignedBy: subtaskData?.assignedByUser?.id || '',
      priority: subtaskData?.priority || '',
      phaseId: subtaskData?.phaseId || '',
      attachments: subtaskData?.attachment || subtaskData?.attachments || [],
    };
  }, [subtaskData, parentTaskData]);

  const handleSubmit = async (values: TCreateSubTaskFormData) => {
    if (!subtaskId) {
      onClose();
      return;
    }

    try {
      // Helper function to check if a value should be included
      const shouldInclude = (value: any): boolean => {
        if (value === null || value === undefined) return false;
        if (value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      };

      // Prepare update payload with all editable fields (excluding null, empty strings, and empty arrays)
      const updatePayload: Record<string, any> = {};

      if (shouldInclude(values.name)) updatePayload.name = values.name;
      if (shouldInclude(values.description)) updatePayload.description = values.description;
      if (shouldInclude(values.priority)) updatePayload.priority = values.priority;
      if (shouldInclude(values.plannedStart)) {
        updatePayload.plannedStart =
          values.plannedStart instanceof Date
            ? values.plannedStart.toISOString()
            : values.plannedStart;
      }
      if (shouldInclude(values.plannedEnd)) {
        updatePayload.plannedEnd =
          values.plannedEnd instanceof Date ? values.plannedEnd.toISOString() : values.plannedEnd;
      }
      if (shouldInclude(values.predecessorTaskIds) && Array.isArray(values.predecessorTaskIds))
        updatePayload.predecessorTaskIds = values.predecessorTaskIds;
      if (shouldInclude(values.phaseId)) updatePayload.phaseId = values.phaseId;
      if (shouldInclude(values.assignedBy)) updatePayload.assignedBy = values.assignedBy;
      if (
        shouldInclude(values.assignee) &&
        Array.isArray(values.assignee) &&
        values.assignee.length > 0
      ) {
        updatePayload.assignee = values.assignee;
      }
      if (
        shouldInclude(values.attachments) &&
        Array.isArray(values.attachments) &&
        values.attachments.length > 0
      ) {
        updatePayload.attachments = values.attachments;
      }

      await updateSubTask({ id: subtaskId, ...updatePayload }).unwrap();
      toast.success('Checklist updated successfully');

      // Refetch subtasks to get updated data
      if (taskId) {
        refetchSubTasks();
      }

      // Close sidebar on success
      onClose();
    } catch (error: any) {
      console.error('Error updating subtask:', error);
      const errorMessage =
        (error as { data?: TErrorResponse })?.data?.message || 'Failed to update checklist';
      toast.error(errorMessage);
    }
  };

  return (
    <DrawerModal opened={isOpen} onClose={onClose}>
      <div className='flex flex-col h-full'>
        {/* Header */}
        <div className='sticky top-0 z-20 gap-10 py-3 px-3 border-b border-gray-200 flex items-center bg-bg-light'>
          <IconButton onClick={onClose}>
            <IconArrowLeft className='size-5 text-text-subHeading' />
          </IconButton>
          <h2 className='mx-auto font-semibold text-gray-900'>
            {subtaskData?.name || 'Checklist'}
          </h2>
        </div>

        {/* Form */}
        <Formik<TCreateSubTaskFormData>
          enableReinitialize
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={baseTaskSchema}
        >
          {({
            values,
            handleChange,
            handleBlur,
            setFieldValue,
            setFieldTouched,
            errors,
            touched,
          }) => (
            <Form className='flex flex-col h-full'>
              {/* Scrollable Content */}
              <div className='flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6'>
                <FormInput
                  placeholder='Type checklist name here'
                  name='name'
                  value={values.name || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.name && errors.name ? errors.name : undefined}
                />

                {/* DESCRIPTION */}
                <DescriptionField
                  label='Description'
                  value={values.description || ''}
                  setValue={(val) => setFieldValue('description', val)}
                />

                {/* PHASE */}
                <Suspense fallback={<FormFieldSkeleton className='w-[60%] h-12' />}>
                  <PhaseSelector
                    label='Phase'
                    value={values.phaseId || ''}
                    setValue={(val) => setFieldValue('phaseId', val || '')}
                  />
                </Suspense>

                {/* Start - End Date */}
                <div className='flex items-center'>
                  <FormLabel className='w-[40%]'>Start-End Date</FormLabel>
                  <div className='w-[60%] flex gap-2'>
                    <FormDate
                      placeholder='Start Date'
                      name='plannedStart'
                      value={values.plannedStart || undefined}
                      onChange={(date) => setFieldValue('plannedStart', date)}
                      onBlur={() => setFieldTouched('plannedStart', true)}
                      error={
                        touched.plannedStart && errors.plannedStart
                          ? errors.plannedStart
                          : undefined
                      }
                    />
                    <FormDate
                      placeholder='End Date'
                      name='plannedEnd'
                      value={values.plannedEnd || undefined}
                      onChange={(date) => setFieldValue('plannedEnd', date)}
                      onBlur={() => setFieldTouched('plannedEnd', true)}
                      error={
                        touched.plannedEnd && errors.plannedEnd ? errors.plannedEnd : undefined
                      }
                    />
                  </div>
                </div>

                {/* Assignee */}
                <div className='flex items-center'>
                  <FormLabel className='w-[40%]'>Assigned To</FormLabel>
                  <Suspense fallback={<FormFieldSkeleton className='w-[60%] h-12' />}>
                    <MembersCombobox
                      disabled={disabled}
                      className='w-[60%]'
                      name='assignee'
                      label=''
                      placeholder='Select assignees'
                      value={(values.assignee || []).filter(
                        (id): id is string => typeof id === 'string',
                      )}
                      setValue={(val) => setFieldValue('assignee', val)}
                      setTouched={(val) => setFieldTouched('assignee', val)}
                      error={touched.assignee && errors.assignee ? errors.assignee : undefined}
                    />
                  </Suspense>
                </div>

                {/* Assigned By */}
                <div className='flex items-center'>
                  <FormLabel className='w-[40%]'>Assigned By</FormLabel>
                  <Suspense fallback={<FormFieldSkeleton className='w-[60%] h-12' />}>
                    <UserSelector
                      allowFilter={false}
                      className='w-[60%]'
                      value={values.assignedBy || ''}
                      setValue={(val) => setFieldValue('assignedBy', val)}
                      error={
                        touched.assignedBy && errors.assignedBy ? errors.assignedBy : undefined
                      }
                    />
                  </Suspense>
                </div>

                {/* Priority */}
                <div className='flex'>
                  <FormLabel className='w-[40%]'>Priority</FormLabel>
                  <FormSelect
                    placeholder='Select Priority'
                    name='priority'
                    value={values.priority || ''}
                    onChange={(val) => setFieldValue('priority', val || '')}
                    onBlur={() => setFieldTouched('priority', true)}
                    options={priorityOptions}
                    className='w-[60%]'
                    error={touched.priority && errors.priority ? errors.priority : undefined}
                  />
                </div>

                {/* Predecessor Task */}
                <div className='flex items-center'>
                  <FormLabel className='w-[40%]'>Predecessor Task</FormLabel>
                  <TaskSelector
                    allowFilter={false}
                    value={values.predecessorTaskIds?.[0] || ''}
                    setValue={(val) => {
                      // Convert single value to array format for consistency
                      setFieldValue('predecessorTaskIds', val ? [val] : []);
                    }}
                  />
                </div>

                {/* Attachment */}
                <FormAttachment
                  inputId={`subTaskAttachments-${subtaskId || index || 0}`}
                  currentAttachments={
                    subtaskId
                      ? [...(values.attachments || []), ...subtaskAttachments]
                      : values.attachments
                  }
                  fieldName={`subTaskAttachments-${subtaskId || index || 0}`}
                  folderName='estate-task-attachments'
                  onUpload={(attachments) => setFieldValue('attachments', attachments)}
                  removeAttachmentFromLocal={(key) => dispatch(removeAttachment({ key }))}
                />
              </div>

              {/* Fixed Footer with Update Button and Mark as Complete */}
              <div className='sticky bottom-0 bg-bg-light border-t border-gray-200 px-4 py-4 flex flex-col gap-3'>
                {subtaskId && (
                  <Button
                    radius='full'
                    type='button'
                    variant='outline'
                    disabled={disabled}
                    onClick={handleMarkComplete}
                    className='w-full flex items-center justify-center gap-2'
                  >
                    {isTaskCompleted(subtaskData?.taskStatus, subtaskData?.status) ? (
                      <>
                        <IconCircleCheck className='size-4' />
                        Mark as Incomplete
                      </>
                    ) : (
                      <>
                        <IconCheck className='size-4' />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                )}
                <Button radius='full' type='submit' disabled={disabled} className='w-full'>
                  {isUpdatingSubTask ? 'Updating...' : 'Update Checklist'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </DrawerModal>
  );
}
