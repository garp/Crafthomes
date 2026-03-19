import { useState, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components';
import TableSearchBar from '../../../components/common/TableSearchBar';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import ClearFilterButton from '../../../components/base/button/ClearFilterButton';
import AddTimelineTemplateSidebar from './AddTimelineTemplateSidebar';
import FormSelect from '../../../components/base/FormSelect';
import { useGetProjectTypeGroupsQuery } from '../../../store/services/projectTypeGroup/projectTypeGroupSlice';

export default function TimelineTemplateHeader() {
  const [query, setQuery] = useState('');
  const { deleteParams } = useUrlSearchParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpenSidebar, { open: openSidebar, close: closeSidebar }] = useDisclosure(false);

  // Get project type group from URL params
  const projectTypeGroupId = searchParams.get('projectTypeGroupId') || '';

  // Fetch project type groups for filter dropdown
  const { data: projectTypeGroupsData } = useGetProjectTypeGroupsQuery({ pageLimit: '100' });

  // Build project type group options with "All" option
  const projectTypeGroupOptions = useMemo(() => {
    const options = [{ label: 'All Project Types', value: '' }];
    if (projectTypeGroupsData?.projectTypeGroups) {
      projectTypeGroupsData.projectTypeGroups.forEach((ptg) => {
        options.push({ label: ptg.name, value: ptg.id });
      });
    }
    return options;
  }, [projectTypeGroupsData]);

  function handleProjectTypeGroupChange(value: string | null) {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('projectTypeGroupId', value);
      } else {
        newParams.delete('projectTypeGroupId');
      }
      // Reset page when filter changes
      newParams.delete('page');
      return newParams;
    });
  }

  function handleClearFilters() {
    deleteParams(['query', 'globalQuery', 'projectTypeGroupId', 'page']);
    setQuery('');
  }

  return (
    <>
      <div className='flex md:flex-row flex-col justify-between gap-5'>
        <div className='flex gap-5 flex-wrap items-end'>
          <TableSearchBar query={query} setQuery={setQuery} />
          <FormSelect
            options={projectTypeGroupOptions}
            value={projectTypeGroupId}
            onChange={handleProjectTypeGroupChange}
            placeholder='Filter by Project Type'
            className='w-56'
            searchable
          />
          <ClearFilterButton onClick={handleClearFilters} />
        </div>
        <div className='flex items-center gap-3'>
          <Button onClick={openSidebar} radius='full' className='w-fit'>
            Add Template
          </Button>
        </div>
      </div>

      <AddTimelineTemplateSidebar isOpen={isOpenSidebar} onClose={closeSidebar} />
    </>
  );
}
