import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Button } from '../../../components';
import TableSearchBar from '../../../components/common/TableSearchBar';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import ClearFilterButton from '../../../components/base/button/ClearFilterButton';
import AddProjectTypeGroupSidebar from './AddProjectTypeGroupSidebar';

export default function ProjectTypeGroupHeader() {
  const [query, setQuery] = useState('');
  const { deleteParams } = useUrlSearchParams();
  const [isOpenSidebar, { open: openSidebar, close: closeSidebar }] = useDisclosure(false);

  function handleClearFilters() {
    deleteParams(['query', 'globalQuery']);
    setQuery('');
  }

  return (
    <>
      <div className='flex md:flex-row flex-col justify-between gap-5'>
        <div className='flex gap-5 flex-wrap'>
          <TableSearchBar query={query} setQuery={setQuery} />
          <ClearFilterButton onClick={handleClearFilters} />
        </div>
        <div className='flex items-center gap-3'>
          <Button onClick={openSidebar} radius='full' className='w-fit'>
            Add Project Type
          </Button>
        </div>
      </div>

      <AddProjectTypeGroupSidebar isOpen={isOpenSidebar} onClose={closeSidebar} />
    </>
  );
}
