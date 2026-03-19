import { useGetUserSettingsQuery } from '../../../store/services/settings/settings';
import { useLazyGetUsersQuery } from '../../../store/services/user/userSlice';
import SearchableCombobox from '../SearchableCombobox';
import FormLabel from '../../base/FormLabel';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import AddInternalUserSidebar from '../../users/AddInternalUserSidebar';

export type TInternalUsersMultiSelectProps = {
  value: string[];
  setValue: (ids: string[]) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
};

export default function InternalUsersMultiSelect({
  value,
  setValue,
  error,
  label,
  placeholder = 'Select team members',
  className,
}: TInternalUsersMultiSelectProps) {
  // Initial load with smaller pageLimit for better performance
  const { data, isFetching } = useGetUserSettingsQuery({
    pageLimit: '30',
    status: 'ACTIVE',
    projectPurpose: true,
  });

  // Lazy query for API-level search
  const [triggerSearchUsers, { data: searchedUsers, isFetching: isSearching }] =
    useLazyGetUsersQuery();

  const [touched, setTouched] = useState(false);
  const [isAddUserOpen, { open: openAddUser, close: closeAddUser }] = useDisclosure(false);
  const [pendingName, setPendingName] = useState<string>('');
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<{
    id: string;
    name: string;
    designation?: any;
  } | null>(null);

  // Helper function to extract users from different data structures
  const extractUsers = (data: any) => {
    // Handle TUserSettings structure: { data: { users: [...], totalCount: number } }
    if (data?.data?.users) {
      return data.data.users;
    }
    // Handle TGetUsersQuery structure: { users: [...], totalCount: number }
    if (data?.users) {
      return data.users;
    }
    return [];
  };

  // Helper function to map user to option
  const mapUserToOption = (u: any) => {
    const designationName =
      typeof u.designation === 'object' ? u.designation?.displayName : u.designation;
    const label = designationName ? `${u.name} - ${designationName}` : u.name;
    return { label, value: u.id };
  };

  function handleUserCreated(id: string, user?: { id: string; name: string; designation?: any }) {
    // Add the newly created user to the selected values
    if (!value.includes(id)) {
      setValue([...value, id]);
    }
    setPendingName('');

    // Store the newly created user so it can be included in defaultData
    if (user) {
      setNewlyCreatedUser(user);
    }
  }

  function handleCreateFromSearch(name: string) {
    setPendingName(name);
    openAddUser();
  }

  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <SearchableCombobox
        name='assignedInternalUsersId'
        value={value || []}
        setValue={setValue}
        onSearch={(q) => {
          if (q && q.trim()) {
            // Trigger API search for internal users
            triggerSearchUsers({
              searchText: q,
              userType: 'INTERNAL',
              status: 'ACTIVE',
              pageLimit: '50',
            });
          }
        }}
        mapToOptions={(data) => {
          const users = extractUsers(data);
          return users.map(mapUserToOption);
        }}
        initialData={data}
        searchedData={
          searchedUsers
            ? ({
                data: { users: searchedUsers.users as any, totalCount: searchedUsers.totalCount },
              } as any)
            : undefined
        }
        placeholder={placeholder}
        isSearching={isFetching || isSearching}
        setTouched={setTouched}
        error={touched && error ? error : undefined}
        defaultData={[
          // Include newly created user if it exists and is selected
          ...(newlyCreatedUser && value.includes(newlyCreatedUser.id)
            ? [mapUserToOption(newlyCreatedUser)]
            : []),
          // Include other selected users from initial data
          ...(extractUsers(data) || [])
            .filter((user: any) => value?.includes(user.id) && user.id !== newlyCreatedUser?.id)
            .map(mapUserToOption),
        ]}
        onCreateFromSearch={handleCreateFromSearch}
      />
      {error && touched && <p className='text-xs text-red-400 mt-1'>{error}</p>}
      <AddInternalUserSidebar
        opened={isAddUserOpen}
        onClose={closeAddUser}
        onCreated={handleUserCreated}
        defaultName={pendingName}
      />
    </div>
  );
}
