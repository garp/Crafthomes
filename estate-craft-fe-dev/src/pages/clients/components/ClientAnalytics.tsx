import { motion } from 'framer-motion';
import { ProjectStatsCard } from '../../../components/common';
import { ClientIcon, ProjectIcon, PaymentIcon, ProgressIcon } from '../../../components/icons';
import { useGetClientsQuery } from '../../../store/services/client/clientSlice';
import { itemVariants } from '../../../constants/common';

export const ClientAnalytics = () => {
  const { data: clientsData } = useGetClientsQuery({});
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
    <motion.div
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'
      variants={itemVariants}
    >
      <ProjectStatsCard
        title={'TOTAL CLIENTS'}
        value={clientsData?.stats?.totalClients}
        icon={getIcon('client')}
        variants={itemVariants}
      />
      <ProjectStatsCard
        title={'TOTAL PROJECTS'}
        value={clientsData?.stats?.totalProjects}
        icon={getIcon('project')}
        variants={itemVariants}
      />
      <ProjectStatsCard
        title={'PENDING PAYMENTS'}
        value={clientsData?.stats?.pendingPayments}
        icon={getIcon('payment')}
        variants={itemVariants}
      />
      <ProjectStatsCard
        title={'AVERAGE PROGRESS'}
        value={clientsData?.stats?.progress}
        icon={getIcon('progress')}
        variants={itemVariants}
      />
    </motion.div>
  );
};
