import { motion } from 'framer-motion';
import { ProgressCircle } from '../../../components/base/ProgressCircle';
import { StepArrowIcon, CalendarIcon, OpenIcon, Avatar } from '../../../components';
import type { TTask } from '../../../store/types/task.types';
import { format } from 'date-fns';
import { sanitizeHTML, calculateDuration } from '../../../utils/helper';

const StatusBadge = ({ status }: { status: string }) => {
  return (
    <div className='px-2 py-1 text-sm font-semibold bg-[#F0F0F0] text-[#6C6C6C] rounded-full whitespace-nowrap'>
      {status}
    </div>
  );
};

export const TaskCard = ({ taskData }: { taskData: TTask }) => {
  const {
    name,
    description,

    progress,
    plannedEnd,
    plannedStart,
    taskStatus,
    duration,
    assignedByUser,
    // assigneeUser,
    TaskAssignee,
  }: TTask = taskData;

  // Calculate spent time: from plannedStart to today if task has started, otherwise 0
  const spentTime =
    plannedStart && new Date(plannedStart) <= new Date()
      ? calculateDuration(plannedStart, new Date().toISOString()) || 0
      : 0;

  // Allocated time: use duration or default to 0
  const allocatedTime = duration ?? 0;
  // console.log({ taskData });
  return (
    <motion.div
      className='bg-white max-h-104 overflow-y-auto rounded-lg shadow-slate300 p-4 hover:shadow-md shadow-lg transition-shadow duration-200 h-full'
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-semibold text-text-subHeading'>{name}</h3>
          {/* <StarIcon className='size-4 text-[#1F1F1F]' /> */}
        </div>
        <ProgressCircle
          progress={progress ?? 0}
          size={50}
          thickness={3}
          color='#EF3733'
          backgroundColor='#E9EBF0'
          showLabel={true}
          labelSize='xs'
        />
      </div>

      <div
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(description) }}
        className='text-sm text-text-subHeadingfont-normal line-clamp-2 max-h-48  overflow-y-auto no-scrollbar'
      />
      {/* Task Description */}

      <hr className='border-[#E2E8F0] my-3' />

      {/* Status */}
      <div className='flex items-center justify-between'>
        <StatusBadge status={taskStatus} />
        <div className='flex items-center justify-center gap-2 bg-[#E8F3E3] size-8 rounded-full'>
          <StepArrowIcon className='size-4' />
        </div>
      </div>

      <hr className='border-[#E2E8F0] my-3' />

      {/* Assignment Details */}
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-col gap-2'>
          <p className='text-xs font-medium text-text-subHeading'>Assigned By</p>
          <Avatar name={assignedByUser?.name || ''} size='sm' />
        </div>
        <div className='flex flex-col gap-2'>
          <p className='text-xs font-medium text-text-subHeading'>Assigned To</p>
          <Avatar name={TaskAssignee?.[0]?.User?.name || ''} size='sm' />
        </div>
      </div>

      <hr className='border-[#E2E8F0] my-3' />

      {/* TIME */}
      <div className='flex justify-between '>
        <div className=''>
          <p className=' text-sm font-medium text-text-subHeading'>Allocated Time</p>
          <p className='font-semibold text-text-subHeading'>{allocatedTime} days</p>
        </div>
        <div className=''>
          <p className='font-semibold text-sm text-text-subHeading'>Spent Time</p>
          <p className='font-semibold text-text-subHeading'>{spentTime} days</p>
        </div>
      </div>
      <hr className='border-[#E2E8F0] my-3' />
      {/* Action and Date */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div
            className='size-6 rounded-full flex items-center justify-center'
            style={{ backgroundColor: '#DFEFFA' }}
          >
            <OpenIcon className='size-3' />
          </div>
          <span className='text-xs font-medium text-text-subHeading'>Open Task</span>
        </div>
        <div className='flex items-center gap-1'>
          <CalendarIcon className='size-4 text-text-subHeading' />
          <span className='text-xs font-medium text-text-subHeading'>
            {plannedStart ? format(plannedStart, 'MMM dd') : '—'} -{' '}
            {plannedEnd ? format(plannedEnd, 'MMM dd, yyyy') : '—'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
