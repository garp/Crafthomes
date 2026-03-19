import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  useGetProjectTypesQuery,
  useLazyGetProjectTypesQuery,
} from '../../../store/services/projectType/projectTypeSlice';
import SearchSelect from '../SearchSelect';
import AddProjectTypeSidebar from '../../project/AddProjectTypeSidebar';

export type TProjectTypeSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  label?: string;
  className?: string;
  onCreateFromSearch?: (name: string) => void;
};
export default function ProjectTypeSelector({ value, ...props }: TProjectTypeSelectorProps) {
  const { data: defaultData } = useGetProjectTypesQuery({
    pageLimit: '10',
    ...(value ? { id: value } : {}),
  });
  const [triggerSearchProjectTypes, { data: searchedData }] = useLazyGetProjectTypesQuery();
  const [isAddProjectTypeOpen, { open: openAddProjectType, close: closeAddProjectType }] =
    useDisclosure(false);
  const [pendingName, setPendingName] = useState('');

  function handleProjectTypeCreated(id: string, payload?: { phases?: string[] }) {
    props.setValue(id);
    if (payload?.phases?.length) {
      // Optionally notify parent form about default phases via setValue hook if it carries setPhases
      // Consumers can listen to form changes through formik.
    }
    setPendingName('');
  }

  function handleCreateFromSearch(name: string) {
    setPendingName(name);
    openAddProjectType();
  }

  return (
    <>
      <SearchSelect
        noOptionsPlaceholder='No Timeline Template available, add a Timeline Template to get started.'
        placeholder='Select Timeline Template'
        defaultData={defaultData}
        searchedData={searchedData}
        onSearch={(q) =>
          triggerSearchProjectTypes({
            search: q,
            pageLimit: '10',
            ...(value ? { id: value } : {}),
          })
        }
        mapToOptions={(data) =>
          data?.projectTypes?.map((p) => ({
            label: p.name,
            value: p.id,
          })) || []
        }
        paramKey='projectTypeId'
        value={value}
        onCreateFromSearch={handleCreateFromSearch}
        {...props}
      />
      <AddProjectTypeSidebar
        opened={isAddProjectTypeOpen}
        onClose={closeAddProjectType}
        onCreated={handleProjectTypeCreated}
        defaultName={pendingName}
      />
    </>
  );
}
