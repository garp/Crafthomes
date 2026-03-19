import { SegmentedControl } from '@mantine/core';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';
import BackButton from '../../../../../components/base/button/BackButton';
import { useParams } from 'react-router-dom';
import { useGetProjectTimelineQuery } from '../../../../../store/services/projectTimeline/projectTimelineSlice';
import StatusBadge from '../../../../../components/common/StatusBadge';

type ViewMode = 'card' | 'list';

interface TimelineDetailHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function TimelineDetailHeader({
  viewMode,
  onViewModeChange,
}: TimelineDetailHeaderProps) {
  const { id, timelineId } = useParams();
  const { data } = useGetProjectTimelineQuery({ id: timelineId || '' });

  return (
    <section className='justify-between flex md:flex-row flex-col gap-y-2 gap-x-4'>
      <BackButton backTo={`/projects/${id}/timeline`} className='flex'>
        <p>
          {data?.timelines?.[0]?.name} |{' '}
          <span className='inline-flex items-center gap-2 text-text-subHeading'>
            STATUS :
            {data?.timelines?.[0]?.timelineStatus ? (
              <StatusBadge status={data.timelines[0].timelineStatus} />
            ) : null}
          </span>
        </p>
      </BackButton>
      <SegmentedControl
        value={viewMode}
        onChange={(value) => onViewModeChange(value as ViewMode)}
        data={[
          {
            value: 'card',
            label: (
              <div className='flex items-center gap-2'>
                <IconLayoutGrid className='size-4' />
                <span>Card</span>
              </div>
            ),
          },
          {
            value: 'list',
            label: (
              <div className='flex items-center gap-2'>
                <IconList className='size-4' />
                <span>List</span>
              </div>
            ),
          },
        ]}
        classNames={{
          root: 'bg-gray-100',
          indicator: 'bg-white shadow-sm',
        }}
      />
    </section>
  );
}
