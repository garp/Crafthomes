import { motion } from 'framer-motion';
import { lazy, useState, Suspense } from 'react';
import { useDisclosure } from '@mantine/hooks';

import { Button } from '../../../components/base';
import { getUser } from '../../../utils/auth';
// import { GridViewIcon, ListViewIcon } from '../../../components/icons';
import TableSearchBar from '../../../components/common/TableSearchBar';
import ClearFilterButton from '../../../components/base/button/ClearFilterButton';

import StatusFilter from '../../../components/common/selectors/StatusSelector';
import { STATUS_OPTIONS } from '../constants/projectTable';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
const CreateProjectSidebar = lazy(() => import('../../../components/project/AddProjectSidebar'));

export const ProjectHeader = () => {
  // const viewOptions = [
  //   {
  //     value: 'grid',
  //     icon: <GridViewIcon className='w-4 h-4' />,
  //   },
  //   {
  //     value: 'list',
  //     icon: <ListViewIcon className='w-4 h-4' />,
  //   },
  // ];
  const [isOpenSidebar, { open: openSidebar, close: closeSidebar }] = useDisclosure();
  const [query, setQuery] = useState('');
  const { deleteParams } = useUrlSearchParams();
  const currentUserRoleName = getUser()?.role?.name?.toLowerCase?.() ?? '';
  const isAdmin = ['admin', 'super_admin'].includes(currentUserRoleName);
  function handleClearFilters() {
    setQuery('');
    deleteParams(['query', 'status', 'globalQuery']);
  }
  return (
    <>
      <motion.div
        className='flex items-center justify-between gap-4'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className='flex items-center gap-3'>
          <TableSearchBar query={query} setQuery={setQuery} />
          <StatusFilter options={STATUS_OPTIONS} />
          <ClearFilterButton onClick={handleClearFilters} />
        </div>
        {/* View Toggle */}
        <div className='flex items-center gap-3'>
          {/* <SegmentedControl options={viewOptions} value='grid' /> */}
          {isAdmin && (
            <Button variant='primary' size='lg' radius='full' onClick={openSidebar}>
              Create Project
            </Button>
          )}
        </div>
      </motion.div>
      <Suspense fallback={null}>
        <CreateProjectSidebar isOpen={isOpenSidebar} onClose={closeSidebar} />
      </Suspense>
    </>
  );
};
