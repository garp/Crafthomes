import { useEffect, useMemo, useState } from 'react';
import { cn, debounce } from '../../utils/helper';
import FormSelect from '../base/FormSelect';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import type { TSearchSelectProps } from '../../types/common.types';

export default function SearchSelect<T>({
  // value,
  // placeholder,
  setValue,
  allowFilter = false,
  disabled,
  defaultData,
  searchedData,
  onSearch,
  mapToOptions,
  paramKey,
  className,
  inputClassName,
  openAddModal,
  showSelectValue = true,
  onCreateFromSearch,
  ...props
}: TSearchSelectProps<T>) {
  const { setParams } = useUrlSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const allOptions = useMemo(() => mapToOptions(defaultData), [defaultData, mapToOptions]);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const debouncedSearch = useMemo(
    () =>
      debounce((q: string) => {
        onSearch(q);
      }, 500),
    [],
  );
  useEffect(() => {
    if (searchedData) {
      const mapped = mapToOptions(searchedData);
      setOptions(mapped.length > 0 ? mapped : []);
    }
  }, [searchedData, mapToOptions]);

  useEffect(() => {
    // Only set defaultData if there's no active search (searchValue is empty)
    // This prevents defaultData from overwriting search results
    if (defaultData && !searchValue) {
      const mapped = mapToOptions(defaultData);
      setOptions(mapped.length > 0 ? mapped : []);
    }
  }, [defaultData, mapToOptions, searchValue]);
  // computed options with optional create action
  const computedOptions = useMemo(() => {
    const base = options;
    const trimmed = searchValue.trim();
    if (onCreateFromSearch && trimmed) {
      const hasExact = base.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
      if (!hasExact) {
        return [{ label: `Create "${trimmed}"`, value: '__create__' }, ...base];
      }
    }
    return base;
  }, [options, onCreateFromSearch, searchValue]);
  return (
    <FormSelect
      searchValue={searchValue}
      searchable
      clearable
      className={cn('w-full', className)}
      options={computedOptions}
      disabled={disabled}
      onDropdownClose={() => {
        setOptions(allOptions.length > 0 ? allOptions : []);
        setSearchValue('');
      }}
      onSearchChange={(val) => {
        setSearchValue(val);
        if (val === '') {
          setOptions(allOptions);
          return; // Don't search on empty string
        }
        debouncedSearch(val);
      }}
      onChange={(id) => {
        if (id === '__create__' && onCreateFromSearch) {
          const trimmed = searchValue.trim();
          if (trimmed) onCreateFromSearch(trimmed);
          return;
        }
        if (id === 'add' && openAddModal) {
          openAddModal();
          return;
        }
        setValue(id);
        if (allowFilter && paramKey) setParams(paramKey, id);
        if (showSelectValue)
          setSearchValue(computedOptions.find((o) => o.value === id)?.label || '');
      }}
      inputClassName={cn(allowFilter ? '!border-0 !py-6 !rounded-lg' : '', inputClassName)}
      {...props}
    />
  );
}
