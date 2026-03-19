import Badge from '../../../../components/common/Badge';
import { cn } from '../../../../utils/helper';
import { IconChevronRight } from '@tabler/icons-react';
import type { TProjectSummary } from '../../../../store/types/projectSummary.types';
import { Link } from 'react-router-dom';
import ActivityLogs from './ActivityLogs';

type TimelineSectionProps = {
  projectSummary: TProjectSummary;
};

export default function TimelineSection({ projectSummary }: TimelineSectionProps) {
  return (
    <div className='mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2'>
      <TimelineStats projectSummary={projectSummary} />
      <ActivityLogs />
    </div>
  );
}

////////////////TIMELINE STATS SECTION
type TimelineStatsProps = {
  projectSummary: TProjectSummary;
};

function TimelineStats({ projectSummary }: TimelineStatsProps) {
  const { timelineDetails } = projectSummary;
  const phases = timelineDetails?.phases || [];

  return (
    <div className='bg-white rounded-md px-5 py-5'>
      {/* HEADER SECTION */}
      <section className='flex items-center gap-3 flex-wrap'>
        <h6 className='font-bold text-lg text-text-secondary'>Timeline Overview</h6>
        <Badge
          title={`${timelineDetails?.totalTimelines || 0} Timeline${timelineDetails?.totalTimelines !== 1 ? 's' : ''}`}
          className='bg-blue-100 text-blue-500'
          borderColor='border-blue-500'
        />
        <Badge
          title={`${timelineDetails?.totalPhases || 0} Phases`}
          className='bg-orange-100 text-orange-600'
          borderColor='border-orange-500'
        />
      </section>

      {/* TIMELINE STATS SECTION - VERTICAL */}
      <section className='mt-4 space-y-2 max-h-[320px] overflow-y-auto pr-1'>
        {phases.length > 0 ? (
          phases.map((phase) => (
            <Link
              to={`/projects/${projectSummary.id}/timeline/${phase.timelineId}?phaseId=${phase.id}`}
              key={phase.id}
            >
              <TimelineCard timeline={phase} />
            </Link>
          ))
        ) : (
          <p className='text-gray-500 text-sm text-center py-4'>No phases available</p>
        )}
      </section>
    </div>
  );
}

//////////////////////TIMELINE CARD - VERTICAL LAYOUT
type TimelineCardData = {
  name: string;
  totalTasks: number;
  completionPercentage: number;
};

function TimelineCard({ timeline }: { timeline: TimelineCardData }) {
  function getPercentageColor() {
    const completed = timeline.completionPercentage;
    if (completed < 25) return 'text-red-600';
    else if (completed < 50) return 'text-orange-600';
    else if (completed < 75) return 'text-blue-600';
    else return 'text-green-600';
  }

  const percentage = timeline.completionPercentage || 0;
  const circumference = 2 * Math.PI * 16; // ~100.53
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    if (percentage === 0) return 'text-gray-300';
    if (percentage < 25) return 'text-red-500';
    if (percentage < 50) return 'text-orange-500';
    if (percentage < 75) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group'>
      {/* Progress indicator */}
      <div className='relative w-10 h-10 shrink-0'>
        <svg className='w-10 h-10 -rotate-90' viewBox='0 0 40 40'>
          {/* Background circle */}
          <circle
            cx='20'
            cy='20'
            r='16'
            stroke='currentColor'
            strokeWidth='3'
            fill='none'
            className='text-gray-200'
          />
          {/* Progress circle */}
          {percentage > 0 && (
            <circle
              cx='20'
              cy='20'
              r='16'
              stroke='currentColor'
              strokeWidth='3'
              fill='none'
              strokeLinecap='round'
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={getStrokeColor()}
            />
          )}
        </svg>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center text-xs font-bold',
            getPercentageColor(),
          )}
        >
          {percentage}%
        </span>
      </div>

      {/* Phase info */}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-gray-900 truncate' title={timeline?.name}>
          {timeline?.name}
        </p>
        <p className='text-xs text-gray-500'>
          {timeline?.totalTasks} task{timeline?.totalTasks !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Arrow */}
      <IconChevronRight className='size-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity' />
    </div>
  );
}
