import { useEffect, useState } from 'react';
import { Loader } from '../../../components';
import { useGetProjectTasksQuery } from '../../../store/services/task/taskSlice';

// import ProjectLayout from '../../../components/layout/ProjectLayout';
import Container from '../../../components/common/Container';
import ProjectTaskHeader from './components/ProjectTaskHeader';
import ProjectTasksTable from './components/ProjectTasksTable';
import ProjectTasksCardView from './components/ProjectTasksCardView';
import { useParams } from 'react-router-dom';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { getTotalPages } from '../../../utils/helper';

type ViewMode = 'card' | 'list';

export default function ProjectTasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { id } = useParams();
  const { getParam, setParams, deleteParams } = useUrlSearchParams();
  const currentPage = Number(getParam('page') ?? 0);
  const { data: tasksData, isFetching } = useGetProjectTasksQuery(
    {
      projectId: id,
      pageLimit: '10',
      pageNo: getParam('page'),
      search: getParam('query') || undefined,
      taskStatus: getParam('status') || undefined,
      searchText: getParam('globalQuery') || undefined,
      phaseId: getParam('phaseId') || undefined,
      timelineId: getParam('timelineId') || undefined,
      assignedToMe: getParam('assignedToMe') === 'true' || undefined,
      approvalPending: getParam('approvalPending') === 'true' || undefined,
    },
    { skip: !id },
  );

  useEffect(() => {
    if (isFetching) return;

    const totalPages = getTotalPages(tasksData?.totalCount, 10);

    if ((tasksData?.totalCount ?? 0) === 0) {
      if (currentPage > 0) {
        deleteParams(['page']);
      }
      return;
    }

    if ((tasksData?.tasks?.length ?? 0) === 0 && currentPage >= totalPages) {
      const fallbackPage = Math.max(totalPages - 1, 0);
      if (fallbackPage === 0) {
        deleteParams(['page']);
      } else {
        setParams('page', String(fallbackPage));
      }
    }
  }, [
    currentPage,
    deleteParams,
    isFetching,
    setParams,
    tasksData?.tasks?.length,
    tasksData?.totalCount,
  ]);

  return (
    <>
      {/* <ProjectLayout> */}
      <Container className='h-full relative'>
        <ProjectTaskHeader viewMode={viewMode} onViewModeChange={setViewMode} />
        <div className='relative min-h-[200px]'>
          {viewMode === 'card' ? (
            <ProjectTasksCardView
              tasks={tasksData?.tasks ?? []}
              totalCount={tasksData?.totalCount}
            />
          ) : (
            <ProjectTasksTable tasks={tasksData?.tasks ?? []} totalCount={tasksData?.totalCount} />
          )}
          {isFetching && (
            <div
              className='absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg'
              aria-label='Loading'
            >
              <Loader variant='box' size='sm' />
            </div>
          )}
        </div>
      </Container>
      {/* </ProjectLayout> */}
    </>
  );
}
