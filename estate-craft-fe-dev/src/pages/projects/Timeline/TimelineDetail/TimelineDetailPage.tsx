import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../../components/common/Container';
import TimelineDetailHeader from './components/TimelineDetailHeader';
import TimeLineDetailTable from './components/TimeLineDetailTable';
import TimelineStats from './components/TimelineStats';
import { useGetTimelineByIdQuery } from '../../../../store/services/projectTimeline/projectTimelineSlice';
import { Button } from '../../../../components';

type ViewMode = 'card' | 'list';

export default function TimelineDetailPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { id: projectId, timelineId } = useParams();
  const navigate = useNavigate();
  const { isError } = useGetTimelineByIdQuery({ id: timelineId || '' }, { skip: !timelineId });

  if (timelineId && isError) {
    return (
      <Container className='gap-5 py-0 max-h-[calc(100vh-8rem)] px-0'>
        <div className='flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center'>
          <p className='text-text-subHeading font-medium'>
            This timeline has been deleted and is no longer accessible.
          </p>
          <Button radius='full' onClick={() => navigate(`/projects/${projectId}/timeline`)}>
            Back to timelines
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className='gap-5 py-0 max-h-[calc(100vh-8rem)] px-0'>
      <div className='sticky space-y-5 top-0 bg-background z-20 px-5 py-5 border-b shadow'>
        <TimelineDetailHeader viewMode={viewMode} onViewModeChange={setViewMode} />
        <hr className=' border-gray-200' />
        <TimelineStats />
      </div>
      <TimeLineDetailTable viewMode={viewMode} />
    </Container>
  );
}
