import { motion } from 'framer-motion';
import { ProjectStatsCard } from '../../../components/common';
import { useGetVendorsQuery } from '../../../store/services/vendor/vendorSlice';
import { itemVariants } from '../../../constants/common';
import { VendorsIcon, ProjectIcon, PaymentIcon, ProgressIcon } from '../../../components/icons';

export const VendorAnalytics = () => {
  const { data: vendorsData } = useGetVendorsQuery({ pageLimit: '100' });

  const getIcon = (iconType: string) => {
    const iconClass = 'size-15';
    switch (iconType) {
      case 'vendor':
        return <VendorsIcon className={iconClass} />;
      case 'project':
        return <ProjectIcon className={iconClass} />;
      case 'payment':
        return <PaymentIcon className={iconClass} />;
      case 'progress':
        return <ProgressIcon className={iconClass} />;
      default:
        return <VendorsIcon className={iconClass} />;
    }
  };

  // Calculate stats from vendor data
  const totalVendors = vendorsData?.totalCount || 0;
  const activeVendors = vendorsData?.vendor?.filter((v) => v.status === 'ACTIVE').length || 0;
  const inactiveVendors = vendorsData?.vendor?.filter((v) => v.status === 'INACTIVE').length || 0;

  // Get unique specializations count
  const uniqueSpecializations = new Set(
    vendorsData?.vendor?.flatMap((v) => v.specializations?.map((s) => s.specialized?.id) || []) ||
      [],
  ).size;

  return (
    <motion.div
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'
      variants={itemVariants}
    >
      <ProjectStatsCard
        title={'TOTAL VENDORS'}
        value={totalVendors}
        icon={getIcon('vendor')}
        variants={itemVariants}
      />
      <ProjectStatsCard
        title={'ACTIVE VENDORS'}
        value={activeVendors}
        icon={getIcon('project')}
        variants={itemVariants}
      />
      <ProjectStatsCard
        title={'INACTIVE VENDORS'}
        value={inactiveVendors}
        icon={getIcon('payment')}
        variants={itemVariants}
      />
      <ProjectStatsCard
        title={'TOTAL SPECIALIZATIONS'}
        value={uniqueSpecializations}
        icon={getIcon('progress')}
        variants={itemVariants}
      />
    </motion.div>
  );
};
