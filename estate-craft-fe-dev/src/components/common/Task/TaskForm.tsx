import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Form, Formik, useFormikContext } from 'formik';

import type { TFormProps } from '../../../types/common.types';
import { addTaskSchema, type TCreateTaskFormData } from '../../../validators/task';
import { getButtonText, isTaskCompleted, calculateDuration } from '../../../utils/helper';
import { useAppSelector } from '../../../store/hooks';
import { removeAttachment } from '../../../store/services/commentAttachments/comments';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { getUser } from '../../../utils/auth';
import { useMarkTaskCompleteMutation } from '../../../store/services/task/taskSlice';
import {
  useCreateSubTaskMutation,
  useGetSubTasksQuery,
  useDeleteSubTaskMutation,
} from '../../../store/services/subtask/subtaskSlice';

import { FormFieldSkeleton, FormFieldSkeleton2 } from '../../base/Skeletons';
import { Button } from '../../base';
import FormInput from '../../base/FormInput';
import FormDate from '../../base/FormDate';
import FormLabel from '../../base/FormLabel';
import { SubTask } from './AddTaskSidebar';
import FormAttachment from '../../base/FormAttachment';
import CommentsAndActivities from './CommentsAndActivities';
import ProjectSelector from '../selectors/ProjectSelector';
import FormRow from '../../base/FormRow';
import TimelineSelector from '../selectors/TimelineSelector';
import { useParams } from 'react-router-dom';
import { IconChevronRight, IconTrash, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';
import IconButton from '../../base/button/IconButton';
import { triggerConfetti } from '../../../utils/confetti';

// Helper function to safely convert a value to a Date object
const toDate = (value: Date | string | null | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

const normalizeRichTextValue = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const normalizedEmptyHtml = trimmedValue
    .replace(/&nbsp;/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

  if (normalizedEmptyHtml === '<p></p>' || normalizedEmptyHtml === '<p><br></p>') {
    return null;
  }

  return trimmedValue;
};

const PrioritySelector = lazy(() => import('../selectors/PrioritySelector'));
const DescriptionField = lazy(() => import('./DescriptionField'));
const CommentInput = lazy(() => import('./CommentInput'));
import { TaskAssigneeCombobox, TaskAssigneeSelector } from '../selectors/UserSelector';
const PhaseSelector = lazy(() => import('../selectors/PhaseSelector'));
const PredecessorTaskSelector = lazy(() => import('../selectors/PredecessorTaskSelector'));
import FormSelect from '../../base/FormSelect';
import { useGetTaskByIdQuery } from '../../../store/services/task/taskSlice';
import { TASK_STATUS } from '../../../constants/ui';

// Component to track dirty state
function DirtyStateTracker({ onDirtyChange }: { onDirtyChange?: (isDirty: boolean) => void }) {
  const { values, initialValues } = useFormikContext<TCreateTaskFormData>();

  useEffect(() => {
    if (!onDirtyChange) return;

    // Helper function to normalize values for comparison
    const normalize = (val: any): any => {
      if (val === null || val === undefined || val === '') return null;
      if (val instanceof Date) return val.getTime();
      return val;
    };

    // Helper function to compare two values
    const isEqual = (a: any, b: any): boolean => {
      const normA = normalize(a);
      const normB = normalize(b);

      // Both null/undefined/empty
      if (normA === null && normB === null) return true;
      if (normA === null || normB === null) return false;

      // Handle arrays
      if (Array.isArray(normA) && Array.isArray(normB)) {
        if (normA.length !== normB.length) return false;
        // For assignee arrays (string arrays), sort before comparing
        if (normA.length > 0 && typeof normA[0] === 'string') {
          const sortedA = [...normA].sort();
          const sortedB = [...normB].sort();
          return sortedA.every((val, idx) => val === sortedB[idx]);
        }
        // For complex arrays (subTasks, attachments), use JSON comparison
        // Normalize dates in objects before stringifying
        const normalizeForJSON = (arr: any[]) =>
          arr.map((item) => {
            if (typeof item === 'object' && item !== null) {
              const normalized: any = {};
              for (const key in item) {
                if (item[key] instanceof Date) {
                  normalized[key] = item[key].getTime();
                } else {
                  normalized[key] = item[key];
                }
              }
              return normalized;
            }
            return item;
          });
        return JSON.stringify(normalizeForJSON(normA)) === JSON.stringify(normalizeForJSON(normB));
      }
      if (Array.isArray(normA) || Array.isArray(normB)) return false;

      // Primitive comparison
      return normA === normB;
    };

    // Compare relevant fields
    const hasChanges =
      !isEqual(values.name, initialValues.name) ||
      !isEqual(
        normalizeRichTextValue(values.description),
        normalizeRichTextValue(initialValues.description),
      ) ||
      !isEqual(values.plannedStart, initialValues.plannedStart) ||
      !isEqual(values.plannedEnd, initialValues.plannedEnd) ||
      !isEqual(values.duration, initialValues.duration) ||
      !isEqual(values.predecessorTaskIds, initialValues.predecessorTaskIds) ||
      !isEqual(values.assignee, initialValues.assignee) ||
      !isEqual(values.assignedBy, initialValues.assignedBy) ||
      !isEqual(values.priority, initialValues.priority) ||
      !isEqual(values.phaseId, initialValues.phaseId) ||
      !isEqual(values.attachments, initialValues.attachments) ||
      !isEqual(values.subTasks, initialValues.subTasks);

    onDirtyChange(hasChanges);
  }, [values, initialValues, onDirtyChange]);

  return null;
}

// Component to calculate duration when dates change (but NOT when duration itself changes)
function DurationCalculator({ mode }: { mode: 'create' | 'edit' }) {
  const { values, setFieldValue } = useFormikContext<TCreateTaskFormData>();
  const prevDatesRef = useRef<{ start?: Date; end?: Date }>({});
  const durationRef = useRef<number | string | undefined>(values.duration);
  const hasInitializedRef = useRef(false);

  // Keep duration ref in sync
  useEffect(() => {
    durationRef.current = values.duration;
  }, [values.duration]);

  useEffect(() => {
    const startDate = toDate(values.plannedStart) || (mode === 'create' ? new Date() : undefined);
    const endDate = toDate(values.plannedEnd);
    const hasPredecessors = (values.predecessorTaskIds || []).length > 0;

    if (!hasInitializedRef.current) {
      prevDatesRef.current = { start: startDate, end: endDate };
      hasInitializedRef.current = true;
      return;
    }

    // Only calculate duration if dates actually changed
    const startChanged = prevDatesRef.current.start?.getTime() !== startDate?.getTime();
    const endChanged = prevDatesRef.current.end?.getTime() !== endDate?.getTime();

    // Update refs
    prevDatesRef.current = { start: startDate, end: endDate };

    // Only recalculate duration when dates change, not when other things change
    if ((startChanged || endChanged) && startDate && endDate) {
      const calculatedDuration = calculateDuration(startDate, endDate);
      const currentDuration =
        typeof durationRef.current === 'string'
          ? parseInt(durationRef.current, 10)
          : durationRef.current;

      if (calculatedDuration !== null && calculatedDuration !== currentDuration) {
        setFieldValue('duration', calculatedDuration, false);
      }
    } else if (!endDate && durationRef.current !== undefined && !hasPredecessors && endChanged) {
      // Clear duration only if end date was actually cleared (not on initial render)
      setFieldValue('duration', undefined, false);
    }
    // Note: values.duration intentionally NOT in dependency array - we use durationRef instead
    // to avoid re-running when user types in duration field
  }, [values.plannedStart, values.plannedEnd, values.predecessorTaskIds, mode, setFieldValue]);

  return null;
}

// Component to handle Predecessor Tasks logic
function PredecessorTaskHandler({
  values,
  setFieldValue,
  projectId,
  phaseId,
  currentTaskId,
  disabled,
  mode,
  touched,
  errors,
}: {
  values: TCreateTaskFormData;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  projectId?: string;
  phaseId?: string;
  currentTaskId?: string;
  disabled: boolean;
  mode: 'create' | 'edit';
  touched: any;
  errors: any;
}) {
  const predecessorTaskIds = values.predecessorTaskIds || [];

  // Fetch details for all selected predecessor tasks - use individual queries
  const predecessorTask1 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[0] || '' },
    { skip: !predecessorTaskIds[0] },
  );
  const predecessorTask2 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[1] || '' },
    { skip: !predecessorTaskIds[1] },
  );
  const predecessorTask3 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[2] || '' },
    { skip: !predecessorTaskIds[2] },
  );
  const predecessorTask4 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[3] || '' },
    { skip: !predecessorTaskIds[3] },
  );
  const predecessorTask5 = useGetTaskByIdQuery(
    { id: predecessorTaskIds[4] || '' },
    { skip: !predecessorTaskIds[4] },
  );

  // Combine all fetched tasks
  const predecessorTasks = [
    predecessorTask1.data,
    predecessorTask2.data,
    predecessorTask3.data,
    predecessorTask4.data,
    predecessorTask5.data,
  ].filter((task): task is NonNullable<typeof task> => task !== undefined);

  // Check if any predecessor is not completed (includes IN_PROGRESS, PENDING, BLOCKED, etc.)
  const hasIncompletePredecessors = predecessorTasks.some((task) => {
    const status = (task.taskStatus || task.status || '').toUpperCase();
    return status !== 'COMPLETED';
  });

  // Industry-standard behavior: Check if ALL predecessors have end dates
  // Case 1 & 2: If any predecessor has no end date → cannot calculate start date
  // Case 3: If all predecessors have end dates → calculate start date from latest end date

  const hasPredecessors = predecessorTaskIds.length > 0;
  const allPredecessorsHaveEndDates =
    hasPredecessors &&
    predecessorTasks.length > 0 &&
    predecessorTasks.every((task) => task.plannedEnd != null);

  // Get the latest end date from all predecessor tasks (only if all have end dates)
  const latestPredecessorEndDate = allPredecessorsHaveEndDates
    ? predecessorTasks.reduce<Date | null>((latest, task) => {
        if (!task.plannedEnd) return latest;
        const taskEndDate = new Date(task.plannedEnd);
        if (!latest || taskEndDate > latest) {
          return taskEndDate;
        }
        return latest;
      }, null)
    : null;

  // Auto-update start date when predecessor tasks change (Industry-standard logic)
  useEffect(() => {
    if (hasPredecessors) {
      if (allPredecessorsHaveEndDates && latestPredecessorEndDate) {
        // Case 3: All predecessors have end dates → Calculate start date
        const newStartDate = new Date(latestPredecessorEndDate);
        newStartDate.setDate(newStartDate.getDate() + 1); // Finish-to-Start: start = predecessor end + 1 day
        newStartDate.setHours(0, 0, 0, 0);

        // Only update start date if different from current start date
        const currentPlannedStart = toDate(values.plannedStart);
        const shouldUpdateStartDate =
          !currentPlannedStart ||
          Math.abs(currentPlannedStart.getTime() - newStartDate.getTime()) > 1000;

        if (shouldUpdateStartDate) {
          setFieldValue('plannedStart', newStartDate, false);
        }

        // Recalculate end date if duration is set AND start date changed
        // Only do this when start date changes, not when duration changes
        // (duration changes are handled by the duration input's onChange)
        if (shouldUpdateStartDate) {
          const durationValue =
            typeof values.duration === 'string' ? parseInt(values.duration, 10) : values.duration;

          if (durationValue && !isNaN(durationValue) && durationValue > 0) {
            const newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + durationValue);
            newEndDate.setHours(23, 59, 59, 999);

            const currentPlannedEnd = toDate(values.plannedEnd);
            if (
              !currentPlannedEnd ||
              Math.abs(currentPlannedEnd.getTime() - newEndDate.getTime()) > 1000
            ) {
              setFieldValue('plannedEnd', newEndDate, false);
            }
          }
        }
      } else {
        // Case 1 & 2: Predecessors don't have end dates → Clear START date only
        // End date should remain editable and can be set via duration
        if (values.plannedStart) {
          setFieldValue('plannedStart', undefined, false);
        }
        // Do NOT clear end date - it can be set independently via duration
        // once the start date becomes available from predecessor
      }
    } else if (!hasPredecessors) {
      // If predecessors are removed, allow manual date entry again
      // Dates remain as-is (user can edit them)
    }
    // Note: values.duration intentionally NOT in dependency array
    // End date calculation from duration is handled by the duration input's onChange
    // This effect only recalculates end date when start date changes from predecessor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    latestPredecessorEndDate,
    hasPredecessors,
    allPredecessorsHaveEndDates,
    values.plannedStart,
    values.plannedEnd,
    setFieldValue,
    mode,
  ]);

  // Industry-standard: Set status to BLOCKED if predecessors are not completed
  // Disable status field until all predecessors are completed
  useEffect(() => {
    if (hasPredecessors && hasIncompletePredecessors) {
      // If there are incomplete predecessors, set status to BLOCKED
      if (values.taskStatus !== TASK_STATUS.BLOCKED) {
        setFieldValue('taskStatus', TASK_STATUS.BLOCKED, false);
      }
    } else if (hasPredecessors && !hasIncompletePredecessors) {
      // All predecessors are completed - unblock the task
      if (values.taskStatus === TASK_STATUS.BLOCKED) {
        setFieldValue('taskStatus', TASK_STATUS.PENDING, false);
      }
    }
  }, [hasIncompletePredecessors, hasPredecessors, values.taskStatus, setFieldValue]);

  return (
    <>
      {/* Predecessor Tasks - Multi-select */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center'>
          <div className='w-full'>
            <Suspense fallback={<FormFieldSkeleton className='w-full h-12' />}>
              <PredecessorTaskSelector
                value={predecessorTaskIds.filter(
                  (id): id is string => id !== undefined && id !== null,
                )}
                setValue={(ids) => setFieldValue('predecessorTaskIds', ids)}
                projectId={projectId}
                phaseId={phaseId}
                currentTaskId={currentTaskId}
                disabled={disabled}
                error={touched.predecessorTaskIds ? errors.predecessorTaskIds : undefined}
                className='w-full'
              />
            </Suspense>
          </div>
        </div>

        {/* Info Banner: Show when predecessors exist but don't have end dates or are incomplete */}
        {(hasPredecessors && !allPredecessorsHaveEndDates) ||
        (hasPredecessors && hasIncompletePredecessors) ? (
          <div className='flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md'>
            <IconInfoCircle className='w-5 h-5 text-blue-600 mt-0.5 shrink-0' />
            <div className='flex-1'>
              <p className='text-sm text-blue-900 font-medium'>
                {hasIncompletePredecessors
                  ? 'Task blocked by incomplete predecessors'
                  : 'Waiting for predecessor dates'}
              </p>
              <p className='text-xs text-blue-700 mt-1'>
                {hasIncompletePredecessors
                  ? 'This task is automatically set to "Blocked" and cannot be changed until all predecessor tasks are completed. The schedule will be calculated once all predecessor tasks have defined end dates.'
                  : 'This task depends on other tasks. Its schedule will be calculated once all predecessor tasks have defined end dates.'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Task Status */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center'>
          <FormLabel className='w-[40%]'>
            {hasPredecessors && hasIncompletePredecessors
              ? 'Task Status (Auto-blocked)'
              : 'Task Status'}
          </FormLabel>
          <div className='w-[60%]'>
            <FormSelect
              placeholder={
                hasPredecessors && hasIncompletePredecessors
                  ? 'Blocked by predecessors'
                  : 'Select Task Status'
              }
              value={values.taskStatus || ''}
              onChange={(val) => {
                // Don't allow changes if there are incomplete predecessors
                if (hasPredecessors && hasIncompletePredecessors) {
                  return; // Keep it blocked
                }
                setFieldValue('taskStatus', val || '');
              }}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'BLOCKED', label: 'Blocked' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
              clearable={!hasPredecessors || !hasIncompletePredecessors}
              className='w-full'
              disabled={disabled || (hasPredecessors && hasIncompletePredecessors)}
              error={touched.taskStatus && errors.taskStatus ? errors.taskStatus : undefined}
            />
          </div>
        </div>
        {/* Info message when status is blocked by predecessors */}
        {hasPredecessors && hasIncompletePredecessors && (
          <p className='text-xs text-gray-500 ml-[40%]'>
            Task status is automatically set to "Blocked" until all predecessor tasks are completed.
          </p>
        )}
      </div>
    </>
  );
}

export default function TaskForm({
  initialValues,
  disabled: isSubmitting,
  onSubmit,
  defaultPhase,
  mode,
  onDirtyChange,
  taskId,
  taskStatus,
  taskStatusAlt,
  onDelete,
  onApprove,
  showApproveButton,
  isApproving,
  onClose,
  fixedProjectId,
  // defaultPhaseName,
  // defaultPhaseId,
}: TFormProps<TCreateTaskFormData> & {
  defaultPhase?:
    | {
        id: string;
        // name: string;
        project: {
          id: string;
          // name: string;
        };
        timeline: {
          id: string;
          // name: string;
        };
      }
    | undefined;
  onDirtyChange?: (isDirty: boolean) => void;
  taskId?: string;
  taskStatus?: string;
  taskStatusAlt?: string;
  onDelete?: () => void;
  onApprove?: () => void;
  showApproveButton?: boolean;
  isApproving?: boolean;
  fixedProjectId?: string;
  // defaultPhaseName?: string;
  // defaultPhaseId?: string;
}) {
  const { id: projectIdFromParams, timelineId: timelineIdFromParams } = useParams();
  const [projectId, setProjectId] = useState(
    fixedProjectId || defaultPhase?.project?.id || projectIdFromParams || null,
  );
  const [timelineId, setTimelineId] = useState<string | null>(
    timelineIdFromParams || defaultPhase?.timeline?.id || null,
  );

  const [markTaskComplete, { isLoading: isMarkingComplete }] = useMarkTaskCompleteMutation();
  const [createSubTask, { isLoading: isCreatingSubTask }] = useCreateSubTaskMutation();
  const [deleteSubTask] = useDeleteSubTaskMutation();
  const { getParam } = useUrlSearchParams();

  const taskIdFromUrl = getParam('taskId');
  const currentTaskId = taskId || taskIdFromUrl;

  // Fetch subtasks if taskId exists
  const { data: fetchedSubTasks, refetch: refetchSubTasks } = useGetSubTasksQuery(
    { parentTaskId: currentTaskId || '' },
    { skip: !currentTaskId || mode === 'create' },
  );
  const dispatch = useDispatch();
  const disabled = isSubmitting;
  const taskAttachments = useAppSelector((state) => state.commentAttachments.attachments);
  // function removeAttachmentFromLocal(key: string) {}
  function handleNameChange(
    e: React.ChangeEvent<HTMLInputElement>,
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  ) {
    handleChange(e);
    // Task is created only on form submit (AddTaskSidebar handleSubmit), not on first keystroke.
    // This avoids creating a task with a single character and opening Edit sidebar unexpectedly.
  }

  function handleMarkComplete() {
    if (!currentTaskId) return;
    const isCompleted = isTaskCompleted(taskStatus, taskStatusAlt);
    markTaskComplete({ id: currentTaskId })
      .unwrap()
      .then(() => {
        if (!isCompleted) {
          // Trigger confetti only when marking as complete (not incomplete)
          triggerConfetti();
        }
        toast.success(isCompleted ? 'Task marked as incomplete' : 'Task marked as complete');
        if (onClose) {
          onClose();
        }
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
  return (
    <Formik<TCreateTaskFormData>
      enableReinitialize
      initialValues={initialValues}
      onSubmit={(values, { resetForm }) => onSubmit({ data: values, resetForm })}
      validationSchema={addTaskSchema}
    >
      {({
        values,
        handleSubmit,
        errors,
        handleChange,
        handleBlur,
        touched,
        setFieldValue,
        setFieldTouched,
      }) => {
        // console.log({ errors, values });
        return (
          <Form onSubmit={handleSubmit} className=' h-full flex flex-col '>
            <DirtyStateTracker onDirtyChange={onDirtyChange} />
            <DurationCalculator mode={mode} />
            <div className='px-6 pt-6 pb-10 flex flex-col gap-6'>
              {/* NAME */}
              <FormInput
                placeholder='Type Task name here'
                name='name'
                value={values.name}
                onChange={(e) => handleNameChange(e, handleChange)}
                onBlur={handleBlur}
                className='w-full'
                maxLength={500}
                disabled={disabled}
                error={touched.name && errors.name ? errors.name : undefined}
              />
              {/* DESCRIPTION */}
              <DescriptionField
                label='Description'
                value={values.description || ''}
                setValue={(val) => setFieldValue('description', val)}
                disabled={disabled}
              />
              {/* PROJECT SELECTOR */}
              <FormRow label='Select Project'>
                <Suspense fallback={<FormFieldSkeleton2 className='w-[60%] h-12' />}>
                  <ProjectSelector
                    value={values.projectId || projectId || null}
                    setValue={(val) => {
                      setProjectId(val);
                      setFieldValue('projectId', val || '');
                      setFieldTouched('projectId', true);
                    }}
                    disabled={
                      disabled || (fixedProjectId ? true : projectIdFromParams ? true : false)
                    }
                    error={touched.projectId && errors.projectId ? errors.projectId : undefined}
                  />
                </Suspense>
              </FormRow>
              {/* TIMELINE SELECTOR */}
              <FormRow label='Select Timeline'>
                <Suspense fallback={<FormFieldSkeleton2 className='w-[60%] h-12' />}>
                  <TimelineSelector
                    // defaultSearchValue={defaultPhase?.timeline?.name}
                    value={timelineId || null}
                    setValue={(val) => setTimelineId(val)}
                    projectId={projectId || ''}
                    disabled={disabled || !projectId}
                    skip={!projectId}
                  />
                </Suspense>
              </FormRow>
              {/* PHASE */}
              <div className='flex items-center'>
                <FormLabel className='w-[40%]'>Phase</FormLabel>
                <div className='w-[60%]'>
                  <Suspense fallback={<FormFieldSkeleton2 className='w-full h-12' />}>
                    <PhaseSelector
                      // defaultSearchValue={defaultPhase?.name}
                      error={touched.phaseId ? errors.phaseId : undefined}
                      value={values.phaseId || null}
                      setValue={(val) => setFieldValue('phaseId', val)}
                      disabled={disabled || !projectId || !timelineId}
                      timelineId={timelineId || undefined}
                    />
                  </Suspense>
                </div>
              </div>
              {/* Duration */}
              <div className='flex items-center'>
                <FormLabel className='w-[40%]'>Duration (days)</FormLabel>
                <div className='w-[60%]'>
                  <FormInput
                    type='number'
                    placeholder='Enter duration in days'
                    name='duration'
                    value={values.duration ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? undefined : Number(value);

                      // Update duration field directly using setFieldValue
                      setFieldValue('duration', numValue, false);

                      const hasPredecessors = (values.predecessorTaskIds || []).length > 0;

                      // Calculate end date when duration is entered and start date exists
                      if (numValue && !isNaN(numValue) && numValue > 0) {
                        // Only set start date if no predecessors (predecessors control start date)
                        const currentPlannedStart = toDate(values.plannedStart);
                        if (!hasPredecessors && !currentPlannedStart) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          setFieldValue('plannedStart', today, false);
                        }

                        // Calculate end date from start date + duration
                        const baseDate =
                          currentPlannedStart || (hasPredecessors ? undefined : new Date());
                        if (baseDate) {
                          const newEndDate = new Date(baseDate);
                          newEndDate.setDate(newEndDate.getDate() + numValue);
                          newEndDate.setHours(23, 59, 59, 999);
                          setFieldValue('plannedEnd', newEndDate, false);
                        }
                      } else if (value === '') {
                        // Clear end date if duration is cleared
                        if (!hasPredecessors && mode === 'create') {
                          setFieldValue('plannedStart', undefined, false);
                        }
                        setFieldValue('plannedEnd', undefined, false);
                      }
                    }}
                    onBlur={() => setFieldTouched('duration', true)}
                    min={1}
                    className='w-full'
                    disabled={disabled}
                    error={
                      touched.duration && errors.duration ? String(errors.duration) : undefined
                    }
                  />
                </div>
              </div>
              {/* Start - End Date */}
              {(() => {
                // Calculate predecessor status in the main component
                const hasPredecessors = (values.predecessorTaskIds || []).length > 0;
                // Only START date is locked when predecessors exist
                // END date can be edited or calculated from duration
                const startDateLocked = hasPredecessors;

                return (
                  <div className='flex items-center'>
                    <FormLabel className='w-[40%]'>
                      {startDateLocked ? 'Start Date (Auto) / End Date' : 'Start-End Date'}
                    </FormLabel>
                    <div className='w-[60%] flex flex-col gap-2'>
                      <div className='flex gap-2'>
                        <FormDate
                          placeholder={startDateLocked ? 'From predecessor' : 'Start Date'}
                          name='plannedStart'
                          value={toDate(values.plannedStart) || null}
                          onChange={(date) => {
                            // Only allow changes if no predecessor tasks
                            if (startDateLocked) {
                              return; // Don't allow manual changes when predecessors exist
                            }
                            setFieldValue('plannedStart', date);
                            // Recalculate duration when start date changes
                            const endDate = toDate(values.plannedEnd);
                            if (date && endDate) {
                              const duration = calculateDuration(date, endDate);
                              if (duration !== null) {
                                setFieldValue('duration', duration, false);
                              }
                            }
                          }}
                          onBlur={() => setFieldTouched('plannedStart', true)}
                          className='w-full'
                          disabled={disabled || startDateLocked}
                          error={
                            touched.plannedStart && errors.plannedStart
                              ? String(errors.plannedStart)
                              : undefined
                          }
                        />
                        <FormDate
                          placeholder='End Date'
                          name='plannedEnd'
                          value={toDate(values.plannedEnd) || null}
                          onChange={(date) => {
                            setFieldValue('plannedEnd', date);
                            // Recalculate duration when end date changes
                            const startDate = toDate(values.plannedStart);
                            if (startDate && date) {
                              const duration = calculateDuration(startDate, date);
                              if (duration !== null) {
                                setFieldValue('duration', duration, false);
                              }
                            } else if (!date) {
                              setFieldValue('duration', undefined, false);
                            }
                          }}
                          onBlur={() => setFieldTouched('plannedEnd', true)}
                          className='w-full'
                          disabled={disabled}
                          error={
                            touched.plannedEnd && errors.plannedEnd
                              ? String(errors.plannedEnd)
                              : undefined
                          }
                        />
                      </div>
                      {/* Tooltip for locked start date */}
                      {startDateLocked && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Start date is set by predecessor tasks. End date is calculated from
                          duration.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Assignee */}
              <div className='flex flex-col gap-1'>
                <div className='flex items-center'>
                  <FormLabel className='w-[40%]'>Assigned To</FormLabel>
                  <Suspense fallback={<FormFieldSkeleton className='w-[60%] h-12' />}>
                    <div className='w-[60%] flex flex-col gap-1'>
                      <TaskAssigneeCombobox
                        clientId={null} // For now, only show internal users
                        projectId={projectId}
                        value={(values?.assignee || []).filter(
                          (id): id is string => typeof id === 'string',
                        )}
                        setValue={(val) => setFieldValue('assignee', val)}
                        error={touched.assignee ? (errors.assignee as string) : undefined}
                        disabled={disabled}
                        className='w-full'
                      />
                      {!disabled &&
                        (() => {
                          const me = getUser()?.id;
                          const current = (values?.assignee || []).filter(
                            (id): id is string => typeof id === 'string',
                          );
                          const isAssignedToMe = me && current.includes(me);
                          return me && !isAssignedToMe ? (
                            <button
                              type='button'
                              onClick={() => {
                                setFieldValue('assignee', [...current, me]);
                                setFieldTouched('assignee', true);
                              }}
                              className='cursor-pointer text-sm text-blue-600 hover:text-blue-700 hover:underline text-left'
                            >
                              Assign to me
                            </button>
                          ) : null;
                        })()}
                    </div>
                  </Suspense>
                </div>
              </div>
              {/* Assigned BY */}
              <div className='flex items-center'>
                <FormLabel className='w-[40%]'>Assigned By</FormLabel>
                <Suspense fallback={<FormFieldSkeleton className='w-[60%] h-12' />}>
                  <TaskAssigneeSelector
                    clientId={null}
                    projectId={projectId}
                    allowFilter={false}
                    disabled={disabled}
                    className='w-[60%]'
                    value={values.assignedBy || null}
                    setValue={(val) => setFieldValue('assignedBy', val)}
                    error={touched.assignedBy ? errors.assignedBy : undefined}
                  />
                </Suspense>
              </div>

              {/* Priority */}
              <div className='flex'>
                <FormLabel className='w-[40%]'>Priority</FormLabel>
                <Suspense fallback={<FormFieldSkeleton className='w-[60%] h-12' />}>
                  <PrioritySelector
                    value={values.priority}
                    onChange={(val) => setFieldValue('priority', val || '')}
                    onBlur={() => setFieldTouched('priority', true)}
                    className='w-[60%]'
                    disabled={disabled}
                    error={touched.priority && errors.priority ? errors.priority : undefined}
                  />
                </Suspense>
              </div>

              {/* Predecessor Tasks - Multi-select */}
              <PredecessorTaskHandler
                values={values}
                setFieldValue={setFieldValue}
                projectId={projectId || defaultPhase?.project?.id || undefined}
                phaseId={defaultPhase?.id || values.phaseId || undefined}
                currentTaskId={currentTaskId || undefined}
                disabled={disabled}
                mode={mode}
                touched={touched}
                errors={errors}
              />
              {/* SUB TASKS */}
              <div>
                <FormLabel>Checklists</FormLabel>
                {/* Input for creating subtasks on the go */}
                {currentTaskId && mode === 'edit' && !disabled && (
                  <FormInput
                    placeholder='Type checklist name and press Enter'
                    className='w-full mt-2'
                    disabled={isCreatingSubTask}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const subtaskName = input.value.trim();
                        if (subtaskName && currentTaskId) {
                          try {
                            // Auto-assign subtask to parent task's users (NOT from predecessor tasks)
                            // Subtasks inherit assignment from their parent task only
                            const parentAssignee = (values.assignee || []).filter(
                              (id): id is string =>
                                typeof id === 'string' && id !== undefined && id !== null,
                            );
                            const parentAssignedBy = values.assignedBy || '';

                            const result = await createSubTask({
                              parentTaskId: currentTaskId,
                              name: subtaskName,
                              assignee: parentAssignee.length > 0 ? parentAssignee : undefined,
                              assignedBy: parentAssignedBy || undefined,
                            }).unwrap();
                            // Add the created subtask to form values
                            setFieldValue('subTasks', [...(values.subTasks || []), result.data]);
                            input.value = '';
                            refetchSubTasks();
                          } catch (error) {
                            console.error('Error creating subtask:', error);
                            toast.error('Failed to create checklist');
                          }
                        }
                      }
                    }}
                    rightSection={
                      <IconButton type='button'>
                        <IconChevronRight className='size-4' />
                      </IconButton>
                    }
                  />
                )}
                {/* Display subtasks from API or form */}
                <div className='space-y-3 mt-4'>
                  {(() => {
                    // Get all subtasks - prioritize fetched from API, then form values
                    let allSubTasks: any[] = [];

                    if (
                      currentTaskId &&
                      mode === 'edit' &&
                      fetchedSubTasks &&
                      fetchedSubTasks?.subTasks &&
                      Array.isArray(fetchedSubTasks?.subTasks) &&
                      fetchedSubTasks?.subTasks?.length > 0
                    ) {
                      // Use fetched subtasks and map them to form format
                      allSubTasks = fetchedSubTasks.subTasks.map((s: any) => {
                        // Helper to get assignee IDs
                        const getAssigneeIds = (assigneeUser: any) => {
                          if (!assigneeUser) return [];
                          if (Array.isArray(assigneeUser)) {
                            return assigneeUser.map((u: any) => u?.id).filter(Boolean);
                          }
                          return assigneeUser?.id ? [assigneeUser.id] : [];
                        };

                        return {
                          ...s, // Preserve all original fields including id, taskStatus, etc.
                          attachment: s?.attachment || [],
                          description: s?.description || '',
                          name: s?.name || '',
                          taskStatus: s?.taskStatus || s?.status || 'PENDING',
                          phaseId: s?.phaseId || defaultPhase?.id,
                          plannedEnd: s?.plannedEnd ? new Date(s.plannedEnd) : undefined,
                          plannedStart: s?.plannedStart ? new Date(s.plannedStart) : undefined,
                          priority: s?.priority || '',
                          predecessorTaskIds: (() => {
                            // Handle predecessors array
                            const predecessors = s?.predecessors;
                            if (Array.isArray(predecessors) && predecessors.length > 0) {
                              return predecessors
                                .map((p: any) => p?.predecessorTaskId || p?.predecessorTask?.id)
                                .filter((id: any): id is string => typeof id === 'string');
                            }
                            // Fallback to single predecessorTask
                            if (s?.predecessorTask?.id) {
                              return [s.predecessorTask.id];
                            }
                            if (s?.predecessorTaskId) {
                              return [s.predecessorTaskId];
                            }
                            return [];
                          })(),
                          assignee: getAssigneeIds(s?.assigneeUser),
                          assignedBy: s?.assignedByUser?.id || '',
                          duration: s?.duration ? String(s.duration) : undefined, // Convert to string or null
                        };
                      });

                      // Sync with form values
                      if (JSON.stringify(allSubTasks) !== JSON.stringify(values.subTasks || [])) {
                        setFieldValue('subTasks', allSubTasks);
                      }
                    } else if (values.subTasks && Array.isArray(values.subTasks)) {
                      allSubTasks = values.subTasks;
                    }

                    return allSubTasks.map((subtask: any, index: number) => {
                      const subtaskId = subtask?.id;
                      return (
                        <SubTask
                          key={subtaskId || index}
                          subtask={subtask}
                          index={index}
                          onDelete={
                            !disabled && subtaskId
                              ? async () => {
                                  try {
                                    await deleteSubTask({ id: subtaskId }).unwrap();
                                    refetchSubTasks();
                                    // Remove from form values
                                    setFieldValue(
                                      'subTasks',
                                      (values.subTasks || []).filter(
                                        (st: any) => (st as any)?.id !== subtaskId,
                                      ),
                                    );
                                    toast.success('Checklist deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting subtask:', error);
                                    toast.error('Failed to delete checklist');
                                  }
                                }
                              : undefined
                          }
                          removeSubTask={
                            !disabled && !subtaskId
                              ? (idx: number) => {
                                  const newSubTasks = [...(values.subTasks || [])];
                                  newSubTasks.splice(idx, 1);
                                  setFieldValue('subTasks', newSubTasks);
                                  return undefined;
                                }
                              : undefined
                          }
                          taskDisabled={disabled}
                        />
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Attachment */}
              <FormAttachment
                inputId='taskAttachments'
                currentAttachments={
                  mode === 'edit'
                    ? [...(values?.attachments || []), ...taskAttachments]
                    : values?.attachments
                }
                fieldName='taskAttachments'
                folderName='estate-task-attachments'
                onUpload={(attachments) => setFieldValue('attachments', attachments)}
                removeAttachmentFromLocal={(key) => dispatch(removeAttachment({ key }))}
                disabled={disabled}
              />
            </div>

            {/* COMMENTS */}
            {
              <CommentsAndActivities
                projectId={projectId || undefined}
                taskId={currentTaskId || undefined}
              />
            }
            {/* FOOTER SECTION */}
            <section className='w-full flex flex-col justify-end px-3 mt-auto sticky z-20 bottom-0 bg-bg-light py-3 border-t'>
              <CommentInput mode='create' projectId={projectId || undefined} disabled={disabled} />
              <div className='flex flex-col gap-3 mt-5 lg:flex-row lg:items-center lg:justify-between'>
                <div className='flex flex-wrap items-center justify-start gap-3'>
                  {mode === 'edit' &&
                    currentTaskId &&
                    !disabled &&
                    (isTaskCompleted(taskStatus, taskStatusAlt) ? (
                      <Button
                        radius='full'
                        type='button'
                        variant='outline'
                        disabled={disabled || isMarkingComplete}
                        onClick={handleMarkComplete}
                        className='w-fit flex items-center gap-2'
                      >
                        {/* <IconCircleCheck className='size-4' /> */}
                        Mark as Incomplete
                      </Button>
                    ) : (
                      <Button
                        radius='full'
                        type='button'
                        variant='outline'
                        disabled={disabled || isMarkingComplete}
                        onClick={handleMarkComplete}
                        className='w-fit flex items-center gap-2'
                      >
                        {/* <IconCircleCheck className='size-4' /> */}
                        Mark as Complete
                      </Button>
                    ))}
                  {mode === 'edit' && showApproveButton && onApprove && (
                    <Button
                      radius='full'
                      type='button'
                      variant='outline'
                      disabled={disabled || isApproving}
                      onClick={onApprove}
                      className='w-fit flex items-center gap-2'
                    >
                      {isApproving ? 'Approving...' : 'Approve Task'}
                    </Button>
                  )}
                  {!disabled && (
                    <Button radius='full' type='submit' disabled={disabled} className='w-fit'>
                      {getButtonText('Task', disabled, mode)}
                    </Button>
                  )}
                </div>
                {mode === 'edit' && onDelete && (
                  <Button
                    radius='full'
                    type='button'
                    variant='danger'
                    onClick={onDelete}
                    className='w-fit flex items-center gap-2 self-start lg:self-auto'
                  >
                    <IconTrash className='size-4' />
                    Delete Task
                  </Button>
                )}
              </div>
            </section>
          </Form>
        );
      }}
    </Formik>
  );
}
//DESCRIPTION FIELD
