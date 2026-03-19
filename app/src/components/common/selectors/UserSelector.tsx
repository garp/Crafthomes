import { useState, useMemo } from 'react';
import {
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useLazyGetSearchedUsersQuery,
} from '../../../store/services/user/userSlice';
import {
  useGetProjectAssignedUsersQuery,
  useLazyGetProjectAssignedUsersQuery,
} from '../../../store/services/project/projectSlice';
import SearchSelect from '../SearchSelect';
import SearchableCombobox from '../SearchableCombobox';
import { getUser } from '../../../utils/auth';

export type TUserSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
};

export default function UserSelector({ ...props }: TUserSelectorProps) {
  // const [selectValue, setSelectValue] = useState('');
  const { data } = useGetUsersQuery({ pageLimit: '10' });
  const [triggerSearchUsers, { data: searchedUsers }] = useLazyGetSearchedUsersQuery();

  return (
    <SearchSelect
      noOptionsPlaceholder='No Users available, add a User to get started.'
      placeholder='Select User'
      defaultData={data}
      searchedData={searchedUsers}
      onSearch={(q) => triggerSearchUsers({ userName: q })}
      mapToOptions={(data) => data?.users?.map((p) => ({ label: p.name, value: p.id })) || []}
      {...props}
      // paramKey='PhaseId'
    />
  );
}

export type TTaskUserSelectorProps = TUserSelectorProps & {
  clientId?: string | null;
};

export function TaskUserSelector({ clientId, ...props }: TTaskUserSelectorProps) {
  // Get internal users
  const { data: internalUsers } = useGetUsersQuery({
    pageLimit: '50',
    userType: 'INTERNAL',
    status: 'ACTIVE',
  });

  // Get client contacts if clientId is provided
  const { data: clientContacts } = useGetUsersQuery(
    {
      clientId: clientId || '',
      pageLimit: '50',
      userType: 'CLIENT_CONTACT',
    },
    { skip: !clientId },
  );

  const [triggerSearchUsers, { data: searchedUsers }] = useLazyGetSearchedUsersQuery();

  // Combine internal users and client contacts
  const combinedUsers = {
    users: [...(internalUsers?.users || []), ...(clientContacts?.users || [])],
  };

  return (
    <SearchSelect
      noOptionsPlaceholder='No Users available, add a User to get started.'
      placeholder='Select User'
      defaultData={combinedUsers}
      searchedData={searchedUsers}
      onSearch={(q) => triggerSearchUsers({ userName: q })}
      mapToOptions={(data) => data?.users?.map((p) => ({ label: p.name, value: p.id })) || []}
      {...props}
    />
  );
}

export type TTaskAssigneeSelectorProps = TUserSelectorProps & {
  clientId?: string | null;
  projectId?: string | null;
};

export function TaskAssigneeSelector({
  clientId,
  projectId,
  ...props
}: TTaskAssigneeSelectorProps) {
  // Get current logged-in user
  const currentUser = getUser();

  // Get project assigned users if projectId is provided
  const { data: projectAssignedUsers } = useGetProjectAssignedUsersQuery(
    { projectId: projectId || '' },
    { skip: !projectId },
  );

  // Lazy query for searching project assigned users
  const [triggerSearchProjectUsers, { data: searchedProjectUsers }] =
    useLazyGetProjectAssignedUsersQuery();

  // Fallback: Get internal users if no projectId
  const { data: internalUsers } = useGetUsersQuery(
    {
      pageLimit: '50',
      userType: 'INTERNAL',
      status: 'ACTIVE',
    },
    { skip: !!projectId },
  );

  // Get client contacts if clientId is provided
  const { data: clientContacts } = useGetUsersQuery(
    {
      clientId: clientId || '',
      pageLimit: '50',
      userType: 'CLIENT_CONTACT',
    },
    { skip: !clientId },
  );

  const [triggerSearchUsers, { data: searchedUsers }] = useLazyGetSearchedUsersQuery();

  // Use project assigned users if available, otherwise combine internal users and client contacts
  // Always include current user to ensure their name displays when pre-selected
  const combinedUsers = useMemo(() => {
    const baseUsers: any[] = projectId
      ? [...(projectAssignedUsers?.users || [])]
      : [...(internalUsers?.users || []), ...(clientContacts?.users || [])];

    // Add current user if not already in the list
    if (currentUser?.id && currentUser?.name) {
      const isCurrentUserInList = baseUsers.some((u) => u.id === currentUser.id);
      if (!isCurrentUserInList) {
        return {
          users: [
            { id: currentUser.id, name: currentUser.name, userType: 'INTERNAL' },
            ...baseUsers,
          ],
        };
      }
    }

    return { users: baseUsers };
  }, [projectId, projectAssignedUsers, internalUsers, clientContacts, currentUser]);

  // Get user type label
  const getUserTypeLabel = (userType?: string) => {
    if (userType === 'INTERNAL') return '- Internal';
    if (userType === 'CLIENT') return '- Client';
    if (userType === 'VENDOR') return '- Vendor';
    if (userType === 'CLIENT_CONTACT') return '- Client Contact';
    if (userType === 'VENDOR_CONTACT') return '- Vendor Contact';
    if (userType === 'EXTERNAL') return '- External';
    return '';
  };

  return (
    <SearchSelect
      noOptionsPlaceholder='No users available for assignment.'
      placeholder='Select assignee'
      defaultData={combinedUsers}
      searchedData={projectId ? searchedProjectUsers : searchedUsers}
      onSearch={(q) => {
        if (projectId && q.trim()) {
          // Search project assigned users via API
          triggerSearchProjectUsers({ projectId, search: q });
        } else if (!projectId && q.trim()) {
          // Search all users via API
          triggerSearchUsers({ userName: q });
        }
      }}
      mapToOptions={(data) => {
        const users = (data as any)?.users || [];
        return users.map((p: any) => {
          const userTypeLabel = getUserTypeLabel(p.userType);
          const label = userTypeLabel ? `${p.name} ${userTypeLabel}` : p.name;
          return { label, value: p.id };
        });
      }}
      {...props}
    />
  );
}

export type TTaskAssigneeComboboxProps = {
  value: string[];
  setValue: (ids: string[]) => void;
  clientId?: string | null;
  projectId?: string | null;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function TaskAssigneeCombobox({
  clientId,
  projectId,
  value,
  setValue,
  error,
  className,
}: TTaskAssigneeComboboxProps) {
  // Get project assigned users if projectId is provided
  const { data: projectAssignedUsers, isFetching: isFetchingProjectUsers } =
    useGetProjectAssignedUsersQuery({ projectId: projectId || '' }, { skip: !projectId });

  // Lazy query for searching project assigned users
  const [
    triggerSearchProjectUsers,
    { data: searchedProjectUsers, isFetching: isSearchingProjectUsers },
  ] = useLazyGetProjectAssignedUsersQuery();

  // Fallback: Get internal users if no projectId
  const { data: internalUsers, isFetching: isFetchingInternal } = useGetUsersQuery(
    {
      pageLimit: '50',
      userType: 'INTERNAL',
      status: 'ACTIVE',
    },
    { skip: !!projectId },
  );

  // Get client contacts if clientId is provided
  const { data: clientContacts, isFetching: isFetchingContacts } = useGetUsersQuery(
    {
      clientId: clientId || '',
      pageLimit: '50',
      userType: 'CLIENT_CONTACT',
    },
    { skip: !clientId },
  );

  const [triggerSearchUsers, { data: searchedUsers, isFetching: isSearching }] =
    useLazyGetUsersQuery();
  const [touched, setTouched] = useState(false);

  // Use project assigned users if available, otherwise combine internal users and client contacts
  const combinedUsers = projectId
    ? { users: projectAssignedUsers?.users || [] }
    : { users: [...(internalUsers?.users || []), ...(clientContacts?.users || [])] };

  // Get user type label
  const getUserTypeLabel = (userType?: string) => {
    if (userType === 'INTERNAL') return '- Internal';
    if (userType === 'CLIENT') return '- Client';
    if (userType === 'VENDOR') return '- Vendor';
    if (userType === 'CLIENT_CONTACT') return '- Client Contact';
    if (userType === 'VENDOR_CONTACT') return '- Vendor Contact';
    if (userType === 'EXTERNAL') return '- External';
    return '';
  };

  return (
    <div className={className}>
      <SearchableCombobox
        name='assignee'
        value={value || []}
        setValue={setValue}
        onSearch={(q) => {
          if (projectId && q.trim()) {
            // Search project assigned users via API
            triggerSearchProjectUsers({ projectId, search: q });
          } else if (!projectId && q.trim()) {
            // Search all users via API
            triggerSearchUsers({
              searchText: q,
              userType: 'INTERNAL',
              status: 'ACTIVE',
              pageLimit: '50',
            });
          }
        }}
        mapToOptions={(data) => {
          const users = (data as any)?.users || [];
          return users.map((p: any) => {
            const userTypeLabel = getUserTypeLabel(p.userType);
            const label = userTypeLabel ? `${p.name} ${userTypeLabel}` : p.name;
            return { label, value: p.id };
          });
        }}
        initialData={combinedUsers}
        searchedData={projectId ? searchedProjectUsers : searchedUsers}
        placeholder='Select assignees'
        isSearching={
          isFetchingProjectUsers ||
          isFetchingInternal ||
          isFetchingContacts ||
          isSearching ||
          isSearchingProjectUsers
        }
        setTouched={setTouched}
        error={touched && error ? error : undefined}
        defaultData={combinedUsers?.users
          ?.filter((user) => value?.includes(user.id))
          .map((user: any) => {
            const userTypeLabel = getUserTypeLabel(user.userType);
            const label = userTypeLabel ? `${user.name} ${userTypeLabel}` : user.name;
            return { label, value: user.id };
          })}
      />
      {error && touched && <p className='text-xs text-red-400 mt-1'>{error}</p>}
    </div>
  );
}
