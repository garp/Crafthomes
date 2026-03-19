import { useState } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@mantine/core';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { useDisclosure } from '@mantine/hooks';

import ClearFilterButton from '../../../components/base/button/ClearFilterButton';
import StatusFilter from '../../../components/common/selectors/StatusSelector';
import { Button } from '../../../components/base';
import TableSearchBar from '../../../components/common/TableSearchBar';
import { AddTaskSidebar } from '../../../components/common/Task/AddTaskSidebar';
import { statusOptions } from '../constants/constants';

import ProjectSelector from '../../../components/common/selectors/ProjectSelector';
// import { ProjectSelector } from '../../../components/common/ProjectSelector';

export const TaskHeader = () => {
  const { getParam, setParams } = useUrlSearchParams();
  const [query, setQuery] = useState(getParam('query') || '');
  // const [projectName, setProjectName] = useState<string | undefined>(undefined);
  // const handleCreateTask = () => {
  //   console.log('Create task clicked');
  // };
  const { deleteParams } = useUrlSearchParams();
  const [isOpenAddTaskSidebar, { open: openAddTaskSidebar, close: closeAddTaskSidebar }] =
    useDisclosure(false);

  const assignedToMe = getParam('assignedToMe') === 'true';
  const approvalPending = getParam('approvalPending') === 'true';

  function handleClearFilters() {
    deleteParams([
      'status',
      'query',
      'globalQuery',
      'projectId',
      'assignedToMe',
      'approvalPending',
    ]);
    setQuery('');
  }
  // const [triggerSearchProjects, { data: searchedProjects }] = useLazyGetProjectsQuery();
  // const { data: projects } = useGetProjectsQuery({ pageLimit: '10', pageNo: '0' });
  return (
    <>
      <motion.div
        className='flex items-center justify-between gap-4 flex-wrap'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* RIGHT SECTION */}
        <section className='flex  items-center gap-3 max-md:flex-wrap'>
          <div className='min-w-[180px] focus-within:min-w-[260px] transition-[min-width] duration-200 ease-out flex-1 max-w-[320px]'>
            <TableSearchBar query={query} setQuery={setQuery} />
          </div>
          <StatusFilter options={statusOptions} />
          <ProjectSelector
            allowFilter
            value={getParam('projectId')}
            setValue={(val) => setParams('projectId', val)}
          />
          <Checkbox
            label='Assigned to me'
            checked={assignedToMe}
            onChange={(e) =>
              e.currentTarget.checked
                ? setParams('assignedToMe', 'true')
                : deleteParams(['assignedToMe'])
            }
            color='dark.6'
            iconColor='white'
            classNames={{
              root: 'shrink-0',
              label: 'text-sm text-gray-700 whitespace-nowrap cursor-pointer',
            }}
            aria-label='Filter tasks assigned to me'
            styles={{ label: { cursor: 'pointer' } }}
          />
          <Checkbox
            label='Approval Pending'
            checked={approvalPending}
            onChange={(e) =>
              e.currentTarget.checked
                ? setParams('approvalPending', 'true')
                : deleteParams(['approvalPending'])
            }
            color='dark.6'
            iconColor='white'
            classNames={{
              root: 'shrink-0',
              label: 'text-sm text-gray-700 whitespace-nowrap cursor-pointer',
            }}
            aria-label='Filter tasks pending approval'
            styles={{ label: { cursor: 'pointer' } }}
          />
          <ClearFilterButton onClick={handleClearFilters} />
        </section>
        {/* LEFT SECTION */}
        <section className='flex items-center gap-3 max-md:flex-wrap'>
          <Button variant='primary' size='lg' radius='full' onClick={openAddTaskSidebar}>
            Create Task
          </Button>
        </section>
      </motion.div>

      <AddTaskSidebar isOpen={isOpenAddTaskSidebar} onClose={closeAddTaskSidebar} />
    </>
  );
};
