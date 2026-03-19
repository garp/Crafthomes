import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { InProgressIcon, OpenIcon } from '../../../components';
import { itemVariants } from '../../../constants/common';
import { useGetTasksByTypeQuery } from '../../../store/services/summary/summarySlice';
import type { TSummaryTaskByTypeItem } from '../../../store/types/summary.types';

// Helper function to get the first assignee name
const getAssigneeName = (task: TSummaryTaskByTypeItem): string => {
  if (task.assignees && task.assignees.length > 0) {
    const name = task.assignees[0].name;
    // Truncate name if too long
    return name.length > 8 ? `${name.substring(0, 5)}...` : name;
  }
  return '-';
};

// Helper function to get project name
const getProjectName = (task: TSummaryTaskByTypeItem): string => {
  return task.project?.name || '-';
};

// Helper function to get phase name
const getPhaseName = (task: TSummaryTaskByTypeItem): string => {
  return task.phase?.name || '-';
};

// Helper function to format priority for display
const formatPriority = (priority: string | null): string => {
  if (!priority) return '-';
  // Capitalize first letter
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
};

// Loading skeleton component
const TaskSkeleton = () => (
  <div className='animate-pulse'>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className='flex justify-between items-center py-2'>
        <div className='flex items-center space-x-3 flex-1'>
          <div className='shrink-0 w-6 h-6 rounded-md bg-gray-200' />
          <div className='flex-1'>
            <div className='h-4 bg-gray-200 rounded w-3/4 mb-2' />
            <div className='h-3 bg-gray-100 rounded w-1/2' />
          </div>
        </div>
        <div className='h-6 w-12 bg-gray-200 rounded' />
      </div>
    ))}
  </div>
);

export default function TasksSection() {
  const { data, isLoading } = useGetTasksByTypeQuery({ pageNo: 0, pageLimit: 5 });

  const openTasks = data?.openTasks || [];
  const runningTasks = data?.runningTasks || [];

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* OPEN TASKS */}
      <motion.div className='bg-white rounded shadow-sm' variants={itemVariants}>
        <div className='p-4 border-b border-gray-100 flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-gray-900'>Open Tasks</h3>
          <Link to='/tasks' className='text-blue-600 text-sm font-medium hover:text-blue-700'>
            View All
          </Link>
        </div>
        <div className='p-4 space-y-3'>
          {isLoading ? (
            <TaskSkeleton />
          ) : openTasks.length === 0 ? (
            <div className='text-center py-4 text-gray-500 text-sm'>No open tasks</div>
          ) : (
            openTasks.map((task) => (
              <div key={task.id} className='flex justify-between items-center py-2'>
                <div className='flex items-center space-x-3 flex-1'>
                  <div
                    className='shrink-0 w-6 h-6 rounded-md flex items-center justify-center'
                    style={{ backgroundColor: '#DFEFFA' }}
                  >
                    <OpenIcon className='w-3 h-3' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-900'>{task.name}</p>
                    <div className='flex items-center space-x-4 mt-1'>
                      <span className='text-xs text-gray-500'>{getProjectName(task)}</span>
                      <span className='text-xs text-gray-500'>{getAssigneeName(task)}</span>
                      <span className='text-xs text-gray-500'>{getPhaseName(task)}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority?.toLowerCase() === 'high'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {formatPriority(task.priority)}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* RUNNING TASKS */}
      <motion.div className='bg-white rounded shadow-sm' variants={itemVariants}>
        <div className='p-4 border-b border-gray-100 flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-gray-900'>Running Tasks</h3>
          <Link to='/tasks' className='text-blue-600 text-sm font-medium hover:text-blue-700'>
            View All
          </Link>
        </div>

        <div className='p-4 space-y-3'>
          {isLoading ? (
            <TaskSkeleton />
          ) : runningTasks.length === 0 ? (
            <div className='text-center py-4 text-gray-500 text-sm'>No running tasks</div>
          ) : (
            runningTasks.map((task) => (
              <div key={task.id} className='flex justify-between items-center py-2'>
                <div className='flex items-center space-x-3 flex-1'>
                  <div
                    className='shrink-0 w-6 h-6 rounded-md flex items-center justify-center'
                    style={{ backgroundColor: '#E5DFFA' }}
                  >
                    <InProgressIcon className='w-3 h-3' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-900'>{task.name}</p>
                    <div className='flex items-center space-x-4 mt-1'>
                      <span className='text-xs text-gray-500'>{getProjectName(task)}</span>
                      <span className='text-xs text-gray-500'>{getAssigneeName(task)}</span>
                      <span className='text-xs text-gray-500'>{getPhaseName(task)}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority?.toLowerCase() === 'high'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {formatPriority(task.priority)}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
