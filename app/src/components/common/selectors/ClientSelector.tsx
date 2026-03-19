import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  useGetClientsQuery,
  useLazyGetClientsQuery,
} from '../../../store/services/client/clientSlice';
import SearchSelect from '../SearchSelect';
import { AddClientSidebar } from '../../client/AddClientSidebar';

export type TClientSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
};

export default function ClientSelector({ ...props }: TClientSelectorProps) {
  const { data } = useGetClientsQuery({ pageLimit: '10', status: 'ACTIVE' });
  const [triggerSearchClients, { data: searchedClients }] = useLazyGetClientsQuery();
  const [isOpenAddClient, { open: openAddClient, close: closeAddClient }] = useDisclosure(false);
  const [pendingName, setPendingName] = useState<string>('');

  function handleClientCreated(id: string) {
    props.setValue(id);
    setPendingName('');
  }

  function handleCreateFromSearch(name: string) {
    setPendingName(name);
    openAddClient();
  }

  return (
    <>
      <SearchSelect
        noOptionsPlaceholder='No clients available, add a client to get started.'
        placeholder='Select Client'
        defaultData={data}
        searchedData={searchedClients}
        onSearch={(q) => triggerSearchClients({ search: q })}
        mapToOptions={(data) => data?.clients?.map((p) => ({ label: p.name, value: p.id })) || []}
        onCreateFromSearch={handleCreateFromSearch}
        {...props}
        // paramKey='PhaseId'
      />
      <AddClientSidebar
        isOpen={isOpenAddClient}
        onClose={closeAddClient}
        onCreated={handleClientCreated}
        defaultName={pendingName}
      />
    </>
  );
}
