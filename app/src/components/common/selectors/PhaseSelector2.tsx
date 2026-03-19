import { useEffect, useMemo, useRef, useState } from 'react';

import { cn, debounce } from '../../../utils/helper';
import FormSelect from '../../base/FormSelect';

import type { TPhaseSelectorProps } from '../../../types/common.types';
import type { SelectProps } from '@mantine/core';
import { useGetPhasesQuery, useLazyGetPhasesQuery } from '../../../store/services/phase/phaseSlice';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
// import useUrlSearchParams from '../../hooks/useUrlSearchParams';

export default function PhaseSelector({
  //   selectedPhase,
  //   setSelectedPhase,
  //   className,
  className,
  value,
  allowFilter = false,
  setValue,
  // defaultSearchValue,
  // onChange,
  ...props
}: TPhaseSelectorProps & SelectProps) {
  const { setParams } = useUrlSearchParams();
  // const [searchValue, setSearchValue] = useState(defaultSearchValue);

  const { data: initialPhases } = useGetPhasesQuery({ pageLimit: '10', pageNo: '0' });
  const [triggerSearchPhases, { data: searchedPhases }] = useLazyGetPhasesQuery();
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  if (!debouncedSearchRef.current) {
    debouncedSearchRef.current = debounce((q: string) => {
      if (q.trim()) {
        triggerSearchPhases({ search: q, pageLimit: '10' });
      }
    }, 600);
  }

  const allPhasesOptions = useMemo(
    () =>
      initialPhases?.phases?.map((p) => ({
        label: p?.name,
        value: p?.id,
      })) || [{ label: '', value: '' }],
    [initialPhases],
  );
  const [options, setOptions] = useState([{ label: '', value: '' }]);

  useEffect(() => {
    if (searchedPhases) {
      setOptions(
        searchedPhases?.phases?.map((p) => ({
          label: p?.name,
          value: p?.id,
        })),
      );
    }
  }, [searchedPhases]);

  useEffect(() => {
    if (initialPhases) {
      setOptions(
        initialPhases?.phases?.map((p) => ({
          label: p?.name,
          value: p?.id,
        })),
      );
    }
  }, [initialPhases]);

  return (
    <FormSelect
      noOptionsPlaceholder='No Phase available, add a Phase to get started.'
      clearable
      value={value}
      // searchValue={searchValue}
      searchable
      onDropdownClose={() => setOptions(allPhasesOptions)}
      onSearchChange={(val) => {
        // setSearchValue(val);
        if (val === '') setOptions(allPhasesOptions);
        if (debouncedSearchRef.current) debouncedSearchRef.current(val);
      }}
      className={(cn(`w-[20rem]`), className)}
      placeholder='Select Phase'
      options={options}
      onChange={(phaseId) => {
        setValue(phaseId);
        // setSearchValue(options.find((o) => o.value === phaseId)?.label || '');
        if (allowFilter) setParams('phaseId', phaseId);
      }}
      defaultSearchValue='hello'
      {...props}
    />
  );
}
