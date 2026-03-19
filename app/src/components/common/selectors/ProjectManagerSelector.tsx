import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { useGetUserSettingsQuery } from '../../../store/services/settings/settings';
import SearchSelect from '../SearchSelect';
import AddProjectManagerSidebar from '../../project/AddProjectManagerSidebar';
import { capitalizeString } from '../../../utils/helper';

export type TProjectManagerSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  name?: string;
  label?: string;
  className?: string;
};

export default function ProjectManagerSelector({ ...props }: TProjectManagerSelectorProps) {
  const { data: internalUsersResponse } = useGetUserSettingsQuery({
    pageLimit: '100', // Get more users for better filtering
    status: 'ACTIVE',
  });
  const [isAddManagerOpen, { open: openAddManager, close: closeAddManager }] = useDisclosure(false);
  const [pendingName, setPendingName] = useState('');

  function handleManagerCreated(id: string) {
    props.setValue(id);
    setPendingName('');
  }

  function handleCreateFromSearch(name: string) {
    setPendingName(name);
    openAddManager();
  }

  // Show all users, not restricted to PROJECT_MANAGER
  const allUsers = internalUsersResponse?.data?.users || [];

  return (
    <>
      <SearchSelect
        noOptionsPlaceholder='No user available, add a user to get started.'
        placeholder='Assign Project Manager*'
        defaultData={{ users: allUsers }}
        searchedData={{ users: allUsers }}
        onSearch={() => {}} // No search needed since we have all data
        mapToOptions={(data: any) =>
          data?.users?.map((u: any) => {
            const designationName =
              typeof u.designation === 'object' ? u.designation?.displayName : u.designation;
            const capitalizedName = capitalizeString(u.name || '');
            const label = designationName
              ? `${capitalizedName} (${designationName})`
              : capitalizedName;
            return {
              label,
              value: u.id,
            };
          }) || []
        }
        paramKey='projectManagerId'
        onCreateFromSearch={handleCreateFromSearch}
        {...props}
      />
      <AddProjectManagerSidebar
        opened={isAddManagerOpen}
        onClose={closeAddManager}
        onCreated={handleManagerCreated}
        defaultName={pendingName}
      />
    </>
  );
}
