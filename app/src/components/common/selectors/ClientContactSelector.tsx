import { useGetUsersQuery, useLazyGetUsersQuery } from '../../../store/services/user/userSlice';
import SearchableCombobox from '../SearchableCombobox';
import FormLabel from '../../base/FormLabel';
import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { AddClientContactSidebar } from '../../client/AddClientContactSidebar';

export type TClientContactSelectorProps = {
  value: string[];
  setValue: (ids: string[]) => void;
  clientId: string | null;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
};

export default function ClientContactSelector({
  clientId,
  value,
  setValue,
  label,
  error,
  className,
}: TClientContactSelectorProps) {
  const { data, isFetching } = useGetUsersQuery(
    {
      clientId: clientId || '',
      pageLimit: '10',
      userType: 'CLIENT_CONTACT',
    },
    { skip: !clientId },
  );
  const [triggerSearchUsers, { data: searchedUsers, isFetching: isSearching }] =
    useLazyGetUsersQuery();
  const [touched, setTouched] = useState(false);
  const [isOpenAddContact, { open: openAddContact, close: closeAddContact }] = useDisclosure(false);
  const [pendingName, setPendingName] = useState<string>('');

  // Filter out contact IDs that don't belong to the current client
  useEffect(() => {
    if (clientId && data?.users && value && value.length > 0) {
      const validContactIds = data.users.map((user) => user.id);
      const filteredValue = value.filter((id) => validContactIds.includes(id));
      if (filteredValue.length !== value.length) {
        setValue(filteredValue);
      }
    } else if (!clientId && value && value.length > 0) {
      // Clear all contacts if client is deselected
      setValue([]);
    }
  }, [clientId, data, value, setValue]);

  function handleContactCreated(id: string) {
    // Add the newly created contact to the selected values
    if (!value.includes(id)) {
      setValue([...value, id]);
    }
    setPendingName('');
  }

  function handleCreateFromSearch(name: string) {
    if (!clientId) {
      return;
    }
    setPendingName(name);
    openAddContact();
  }

  return (
    <>
      <div className={className}>
        {label && <FormLabel>{label}</FormLabel>}
        <SearchableCombobox
          name='assignClientContact'
          value={value || []}
          setValue={setValue}
          onSearch={(q) => {
            if (clientId && q.trim()) {
              triggerSearchUsers({
                searchText: q,
                clientId,
                pageLimit: '10',
                userType: 'CLIENT_CONTACT',
              });
            }
          }}
          mapToOptions={(data) => data?.users?.map((p) => ({ label: p.name, value: p.id })) || []}
          initialData={data}
          searchedData={searchedUsers}
          placeholder='Select Client Contacts'
          isSearching={isFetching || isSearching}
          setTouched={setTouched}
          error={touched && error ? error : undefined}
          defaultData={data?.users
            ?.filter((user) => value?.includes(user.id))
            .map((user) => ({ label: user.name, value: user.id }))}
          onCreateFromSearch={clientId ? handleCreateFromSearch : undefined}
        />
        {error && touched && <p className='text-xs text-red-400 mt-1'>{error}</p>}
      </div>
      {clientId && (
        <AddClientContactSidebar
          isOpen={isOpenAddContact}
          onClose={closeAddContact}
          onCreated={handleContactCreated}
          defaultName={pendingName}
          clientId={clientId}
        />
      )}
    </>
  );
}
