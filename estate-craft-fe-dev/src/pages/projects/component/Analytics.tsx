// import { motion } from 'framer-motion';
import { ProjectStatsCard } from '../../../components/common';
import { ClientIcon, ProjectIcon, PaymentIcon, ProgressIcon } from '../../../components/icons';
import { useGetProjectsQuery } from '../../../store/services/project/projectSlice';
import { ProjectStatsSkeleton } from '../../../components/base/Skeletons';
import { itemVariants } from '../../../constants/common';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';

export const Analytics = () => {
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';
  // Use same query params as ProjectTable to share the cached response
  const {
    data: projectsData,
    isFetching,
    isError,
  } = useGetProjectsQuery({
    pageNo: page,
    pageLimit: '10',
    search: getParam('query') || '',
    projectStatus: getParam('status') || '',
    searchText: getParam('globalQuery') || '',
    avgProgress: true,
  });
  const getIcon = (iconType: string) => {
    const iconClass = 'size-15';
    switch (iconType) {
      case 'client':
        return <ClientIcon className={iconClass} />;
      case 'project':
        return <ProjectIcon className={iconClass} />;
      case 'payment':
        return <PaymentIcon className={iconClass} />;
      case 'progress':
        return <ProgressIcon className={iconClass} />;
      default:
        return <ClientIcon className={iconClass} />;
    }
  };

  return (
    <div
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'
      // variants={itemVariants}
    >
      {isFetching || isError ? (
        <ProjectStatsSkeleton />
      ) : (
        <>
          <ProjectStatsCard
            title={'TOTAL CLIENT'}
            value={projectsData?.stats?.totalClients}
            icon={getIcon('client')}
            variants={itemVariants}
          />
          <ProjectStatsCard
            title={'TOTAL PROJECTS'}
            value={projectsData?.stats?.totalProjects}
            icon={getIcon('project')}
            variants={itemVariants}
          />
          <ProjectStatsCard
            title={'PENDING PAYMENT'}
            value={projectsData?.stats?.pendingPayments}
            icon={getIcon('payment')}
            variants={itemVariants}
          />
          <ProjectStatsCard
            title={'AVERAGE PROGRESS'}
            value={projectsData?.stats?.avgProgress}
            icon={getIcon('progress')}
            variants={itemVariants}
          />
        </>
      )}
    </div>
  );
};
