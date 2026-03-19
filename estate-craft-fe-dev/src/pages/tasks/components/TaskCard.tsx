import { motion } from 'framer-motion';
import { ProgressCircle } from '../../../components/base/ProgressCircle';
import {
  StepArrowIcon,
  CalendarIcon,
  Avatar,
  DeleteButton,
  ActionButton,
} from '../../../components';
import { IconCircleCheck } from '@tabler/icons-react';
import type { TTask } from '../../../store/types/task.types';
import { format } from 'date-fns';
import {
  canUserApproveTask,
  isTaskApproved,
  isTaskCompleted,
  calculateDuration,
} from '../../../utils/helper';
import { getUser } from '../../../utils/auth';

const StatusBadge = ({ status }: { status: string }) => {
  return (
    <div className='px-2 py-1 text-sm font-semibold bg-[#F0F0F0] text-[#6C6C6C] rounded-full whitespace-nowrap'>
      {status}
    </div>
  );
};

export const TaskCard = ({
  taskData,
  onDelete,
  onMarkComplete,
  onApprove,
  isMarkingComplete,
}: {
  taskData: TTask;
  onDelete?: (task: TTask) => void;
  onMarkComplete?: (task: TTask) => void;
  onApprove?: (task: TTask) => void;
  isMarkingComplete?: boolean;
}) => {
  const {
    name,
    progress,
    plannedEnd,
    plannedStart,
    taskStatus,
    duration,
    assignedByUser,
    approvedByUser,
    approvedAt,
    // assigneeUser,
    TaskAssignee,
  }: TTask = taskData;
  const currentUser = getUser();

  const isCompleted = isTaskCompleted(taskData?.status, taskData?.taskStatus);
  const isApproved = isTaskApproved(taskData);
  const showApproveAction = canUserApproveTask(taskData, currentUser);

  // Calculate spent time: from plannedStart to today if task has started, otherwise 0
  const spentTime =
    plannedStart && new Date(plannedStart) <= new Date()
      ? calculateDuration(plannedStart, new Date().toISOString()) || 0
      : 0;

  // Allocated time: use duration or default to 0
  const allocatedTime = duration ?? 0;

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 h-full flex flex-col overflow-hidden border border-gray-100 cursor-pointer ${isCompleted && !isApproved ? 'opacity-60' : ''}`}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className='p-4 flex-1 flex flex-col gap-2'>
        {/* Header */}
        <div className='flex items-center justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <h3 className='text-base font-semibold text-gray-900 leading-tight line-clamp-2'>
              {name}
            </h3>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            {onDelete && !isApproved && (
              <div onClick={(e) => e.stopPropagation()}>
                <DeleteButton
                  onDelete={() => onDelete(taskData)}
                  tooltip='Delete Task'
                  className='hover:bg-red-50'
                />
              </div>
            )}
            <ProgressCircle
              progress={progress ?? 0}
              size={48}
              thickness={3.5}
              color={
                progress === 100
                  ? '#10B981'
                  : progress >= 75
                    ? '#3B82F6'
                    : progress >= 50
                      ? '#F59E0B'
                      : '#EF3733'
              }
              backgroundColor='#E9EBF0'
              showLabel={true}
              labelSize='xs'
            />
          </div>
        </div>

        {/* Status */}
        <div className='flex items-center justify-between gap-3'>
          <StatusBadge status={taskStatus} />
          <div className='flex items-center justify-center bg-[#E8F3E3] size-9 rounded-full shrink-0'>
            <StepArrowIcon className='size-4 text-green-700' />
          </div>
        </div>
        {isApproved && (
          <div className='rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2'>
            <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>
              Approved
            </p>
            <p className='text-sm font-medium text-emerald-900'>by {approvedByUser?.name || '—'}</p>
            {approvedAt && (
              <p className='text-xs text-emerald-700 mt-0.5'>
                {format(new Date(approvedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </div>
        )}

        {/* Assignment Details */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-1'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
              Assigned By
            </p>
            <Avatar name={assignedByUser?.name || ''} size='sm' />
          </div>
          <div className='flex flex-col gap-1'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
              Assigned To
            </p>
            <Avatar name={TaskAssignee?.[0]?.User?.name || ''} size='sm' />
          </div>
        </div>

        {/* TIME */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
              Allocated Time
            </p>
            <p className='text-base font-bold text-gray-900'>{allocatedTime} days</p>
          </div>
          <div className='flex flex-col gap-0.5'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
              Spent Time
            </p>
            <p className='text-base font-bold text-gray-900'>{spentTime} days</p>
          </div>
        </div>
      </div>

      {/* Footer - Action and Date */}
      <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2' onClick={(e) => e.stopPropagation()}>
          <ActionButton
            icon={
              !isTaskCompleted(taskData?.status, taskData?.taskStatus) ? (
                <IconCircleCheck className='size-5 text-gray-600' />
              ) : (
                <IconCircleCheck className='size-5 text-green-600' />
              )
            }
            tooltip={
              isTaskCompleted(taskData?.status, taskData?.taskStatus)
                ? 'Mark as Incomplete'
                : 'Mark as Complete'
            }
            onClick={() => onMarkComplete?.(taskData)}
            disabled={isMarkingComplete || isApproved}
            className={
              isTaskCompleted(taskData?.status, taskData?.taskStatus)
                ? 'hover:text-gray-800'
                : 'hover:text-green-700'
            }
          />
          {showApproveAction && (
            <button
              type='button'
              onClick={() => onApprove?.(taskData)}
              className='cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 transition-colors'
            >
              Approve
            </button>
          )}
        </div>
        {plannedStart && plannedEnd && (
          <div className='flex items-center gap-2 text-xs'>
            <CalendarIcon className='size-4 text-gray-500 shrink-0' />
            <span className='font-medium text-gray-700 whitespace-nowrap'>
              {format(plannedStart, 'MMM dd')} - {format(plannedEnd, 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
