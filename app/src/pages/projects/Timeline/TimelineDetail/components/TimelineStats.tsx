import { Progress } from '@mantine/core';
import { useParams } from 'react-router-dom';
// import { CalendarIcon } from '../../../../../components';
import { useGetTimelineByIdQuery } from '../../../../../store/services/projectTimeline/projectTimelineSlice';

export default function TimelineStats() {
  const { timelineId } = useParams();
  const { data: timelineData } = useGetTimelineByIdQuery(
    { id: timelineId || '' },
    { skip: !timelineId },
  );

  const stats = timelineData?.stats || {
    totalTasks: 0,
    totalSubTasks: 0,
    completedTasks: 0,
    completedSubTasks: 0,
    progressPercentage: 0,
  };

  return (
    <section className='flex md:flex-row gap-x-2 gap-y-1 flex-col justify-between'>
      <div className='flex gap-5'>
        <p className='text-sm font-medium'>
          <span className='text-text-subHeading'>Total Task:</span> {stats.totalTasks}
        </p>
        <p className='text-sm font-medium'>
          <span className='text-text-subHeading'>Total Checklists:</span> {stats.totalSubTasks}
        </p>
        <p className='text-sm font-medium'>
          <span className='text-text-subHeading'>Completed Tasks:</span> {stats.completedTasks}
        </p>
        <p className='text-sm font-medium'>
          <span className='text-text-subHeading'>Completed Checklists:</span>{' '}
          {stats.completedSubTasks}
        </p>
      </div>

      <div className='flex gap-4 text-text-subHeading items-center'>
        {/* <p className='text-xs font-medium'>14 May 25 - 14 May 25 | 1 Day&#40;s&#41;</p> */}
        <div className='flex gap-2 items-center'>
          <p className='text-xs font-medium'>{stats.progressPercentage}%</p>
          <Progress value={stats.progressPercentage} size='md' w={150} />
        </div>
        {/* <div className='flex gap-2  items-center'>
          <CalendarIcon className='size-4' />
          <p className='text-xs font-medium'>1 Day &#40;s&#41;</p>
        </div> */}
      </div>
    </section>
  );
}
