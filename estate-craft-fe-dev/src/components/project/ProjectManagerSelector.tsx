import { useEffect, useRef, useState } from 'react';

import FormSelect from '../base/FormSelect';

import { cn, debounce, capitalizeString } from '../../utils/helper';

import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import { useGetUsersQuery, useLazyGetUsersQuery } from '../../store/services/user/userSlice';
import type { TProjectManagerSelectorProps } from '../../types/projectManager.types';

export default function ProjectManagerSelector({
  // selectedProjectManager,
  // setSelectedProjectManager,
  allowFilter = true,
  // formik,
  className,
  defaultSearchValue,
  setValue,
  value,
  ...props
}: TProjectManagerSelectorProps) {
  // console.log({ defaultSearchValue });
  // const [selectedProjectManager, setSelectedProjectManager] = useState('');
  // const [inputValue, setInputValue] = useState('');
  const { setParams } = useUrlSearchParams();
  const { data: initialProjectManagers } = useGetUsersQuery({
    pageLimit: '100', // Get more users
    status: 'ACTIVE',
  });
  const [triggerSearchClients, { data: searchedClients }] = useLazyGetUsersQuery();
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  if (!debouncedSearchRef.current) {
    debouncedSearchRef.current = debounce((q: string) => {
      if (q.trim()) {
        triggerSearchClients({ searchText: q, status: 'ACTIVE' });
      }
    }, 500);
  }

  const formatUserLabel = (user: any) => {
    const designationName =
      typeof user.designation === 'object' ? user.designation?.displayName : user.designation;
    const capitalizedName = capitalizeString(user?.name || '');
    return designationName ? `${capitalizedName} (${designationName})` : capitalizedName;
  };

  const allClientsOptions = initialProjectManagers?.users?.map((c) => ({
    label: formatUserLabel(c),
    value: c?.id,
  })) || [{ label: '', value: '' }];

  const [options, setOptions] = useState([{ label: '', value: '' }]);

  useEffect(() => {
    if (searchedClients) {
      setOptions(searchedClients?.users?.map((c) => ({ label: formatUserLabel(c), value: c?.id })));
    }
  }, [searchedClients]);

  useEffect(() => {
    if (initialProjectManagers) {
      setOptions(
        initialProjectManagers?.users?.map((c) => ({ label: formatUserLabel(c), value: c?.id })),
      );
    }
  }, [initialProjectManagers]);

  return (
    <FormSelect
      {...props}
      defaultSearchValue={defaultSearchValue}
      // defaultValue={formik?.values?.projectTypeId}
      value={value}
      name='assignProjectManager'
      placeholder='Project manager'
      label='Assign Project Manager*'
      clearable
      searchable
      onDropdownClose={() => setOptions(allClientsOptions)}
      onSearchChange={(val) => {
        if (val === '') setOptions(allClientsOptions);
        if (debouncedSearchRef.current) debouncedSearchRef.current(val);
      }}
      className={cn(`w-[20rem]`, className)}
      onChange={(projectManagerId) => {
        setValue(projectManagerId);
        // setInputValue(options?.find((o) => o.value === projectManagerId)?.value || '');
        // setSelectedProjectManager(options.find((o) => o.value === projectManagerId)?.value || '');
        if (allowFilter) setParams('projectManagerId', projectManagerId);
      }}
      options={options}
    />
  );
}
