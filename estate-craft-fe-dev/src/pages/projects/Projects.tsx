import { PageTransition } from '../../components/common';
import { Analytics } from './component/Analytics';
import { ProjectHeader } from './component/ProjectHeader';
import { ProjectTable } from './component/ProjectTable';
import { useGetProjectsQuery } from '../../store/services/project/projectSlice';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';

export const Projects = () => {
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';
  const searchQuery = getParam('query') || '';
  const statusFilter = getParam('status') || '';
  const globalQuery = getParam('globalQuery') || '';

  const { data: projectsData, isFetching } = useGetProjectsQuery({
    pageNo: page,
    pageLimit: '10',
    search: searchQuery,
    projectStatus: statusFilter,
    searchText: globalQuery,
  });

  // Check if there are no projects and no active filters
  const hasNoProjects = !isFetching && projectsData?.projects?.length === 0;
  const hasActiveFilters = searchQuery || statusFilter || globalQuery;
  const shouldHideSections = hasNoProjects && !hasActiveFilters;

  return (
    <PageTransition>
      {!shouldHideSections && <Analytics />}
      {!shouldHideSections && <ProjectHeader />}
      <ProjectTable />
    </PageTransition>
  );
};
