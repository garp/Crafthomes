import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import type { TBaseSearchSelectorProps } from '../../../constants/common';
import {
  useGetVendorsQuery,
  useLazyGetVendorsQuery,
} from '../../../store/services/vendor/vendorSlice';
import SearchSelect from '../SearchSelect';
import AddVendorSidebar from '../../vendor/AddVendorSidebar';

export type TVendorSelectorProps = TBaseSearchSelectorProps & {
  value?: string | null;
};

export default function VendorSelector({ value, allowFilter, ...props }: TVendorSelectorProps) {
  const { data } = useGetVendorsQuery({ pageLimit: '10', id: value || undefined });
  const [triggerSearchVendors, { data: searchedUsers }] = useLazyGetVendorsQuery();
  const [isAddVendorOpen, { open: openAddVendor, close: closeAddVendor }] = useDisclosure(false);
  const [pendingName, setPendingName] = useState<string>('');

  function handleVendorCreated(id: string) {
    props.setValue(id);
    setPendingName('');
  }

  function handleCreateFromSearch(name: string) {
    setPendingName(name);
    openAddVendor();
  }

  return (
    <>
      <SearchSelect
        noOptionsPlaceholder={
          allowFilter ? 'No vendor found' : 'No Vendor available, add a Vendor to get started.'
        }
        placeholder='Select Vendor'
        defaultData={data}
        searchedData={searchedUsers}
        onSearch={(q) => triggerSearchVendors({ search: q })}
        mapToOptions={(data) => data?.vendor?.map((p) => ({ label: p.name, value: p.id })) || []}
        defaultSearchValue={value ? data?.vendor?.[0]?.name : undefined}
        value={value}
        onCreateFromSearch={allowFilter ? undefined : handleCreateFromSearch}
        {...props}
      />
      {!allowFilter && (
        <AddVendorSidebar
          isOpen={isAddVendorOpen}
          onClose={closeAddVendor}
          onCreated={handleVendorCreated}
          defaultName={pendingName}
        />
      )}
    </>
  );
}
