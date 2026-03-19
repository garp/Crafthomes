import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { PillsInput, Pill, Combobox, Group, useCombobox, Checkbox } from '@mantine/core';
import { ChevronDownIcon } from '../icons';
import { debounce } from '../../utils/helper';
import type { TOption } from '../../types/common.types';
import Spinner from './loaders/Spinner';

export type TSeachableComboboxProps<T> = {
  value: string[];
  setValue: (val: string[]) => void;
  onSearch: (q: string, pageNo?: number) => void;
  mapToOptions: (data: T | undefined) => { label: string; value: string }[];
  initialData?: T;
  searchedData?: T;
  placeholder: string;
  name: string;
  label?: string;
  isSearching?: boolean;
  setTouched: (arg: boolean) => void;
  error?: string | string[] | undefined;
  showSelectedValues?: boolean;
  defaultData?: { value: string; label: string }[];
  className?: string;
  totalCount?: number;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onCreateFromSearch?: (name: string) => void;
};

export default function SearchableCombobox<T>({
  value,
  setValue,
  mapToOptions,
  onSearch,
  initialData,
  searchedData,
  placeholder,
  name,
  label,
  isSearching,
  setTouched,
  error,
  showSelectedValues = true,
  defaultData,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalCount: _totalCount,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
  onCreateFromSearch,
}: TSeachableComboboxProps<T>) {
  const [search, setSearch] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<TOption[]>([]);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef<number>(0);
  const isSearchModeRef = useRef<boolean>(false);

  const [options, setOptions] = useState<TOption[]>([]);

  const debouncedSearch = useMemo(
    () =>
      debounce((q: string) => {
        if (q && q.trim()) {
          currentPageRef.current = 0;
          isSearchModeRef.current = true;
          onSearch(q, 0);
        }
      }, 500),
    [onSearch],
  );
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  function handleValueSelect(val: string) {
    // Handle create action
    if (val === '__create__' && onCreateFromSearch) {
      const trimmed = search.trim();
      if (trimmed) {
        onCreateFromSearch(trimmed);
        setSearch(''); // Clear search after triggering create
      }
      return;
    }

    const isAlreadyExists = value.includes(val);
    const ids = isAlreadyExists ? value.filter((v) => v !== val) : [...value, val];
    setValue(ids);

    // Find the selected option from multiple sources - prioritize current options
    const selectedOption =
      options.find((o) => o.value === val) ||
      defaultData?.find((o) => o.value === val) ||
      selectedOptions.find((o) => o.value === val);

    if (selectedOption) {
      // Update or add to selectedOptions immediately using state
      if (isAlreadyExists) {
        setSelectedOptions((prev) => prev.filter((v) => v.value !== val));
      } else {
        // Check if already exists in selectedOptions to avoid duplicates
        setSelectedOptions((prev) => {
          const exists = prev.find((opt) => opt.value === val);
          if (!exists) {
            return [...prev, selectedOption];
          } else {
            // Update existing entry to ensure label is current
            return prev.map((opt) => (opt.value === val ? selectedOption : opt));
          }
        });
      }
    }
  }

  function handleValueRemove(val: string) {
    setValue(value.filter((v) => v !== val));
  }

  useEffect(() => {
    if (defaultData) {
      const initialOptions = mapToOptions(initialData) || [];
      // Merge defaultData with initial options, ensuring no duplicates
      const mergedOptions = [
        ...defaultData,
        ...initialOptions.filter((opt) => !defaultData.find((d) => d.value === opt.value)),
      ];
      setOptions(mergedOptions);
      // Update selectedOptions with defaultData, but preserve any existing selections not in defaultData
      setSelectedOptions((prev) => {
        const defaultDataValues = new Set(defaultData.map((opt) => opt.value));
        const existingNotInDefault = prev.filter((opt) => !defaultDataValues.has(opt.value));
        const updated = [...defaultData, ...existingNotInDefault];

        // Also sync any selected values that might not be in defaultData but are in mergedOptions
        if (value && value.length > 0) {
          value.forEach((val) => {
            if (!updated.find((opt) => opt.value === val)) {
              const found = mergedOptions.find((opt) => opt.value === val);
              if (found) {
                updated.push(found);
              }
            }
          });
        }

        return updated;
      });
    } else if (initialData && !isSearchModeRef.current) {
      // Update options when initialData changes (e.g., after load more)
      const initialOptions = mapToOptions(initialData);
      // Merge with selected options to ensure they're always available
      if (selectedOptions.length > 0) {
        const initialOptionsSet = new Set(initialOptions.map((opt) => opt.value));
        const missingSelectedOptions = selectedOptions.filter(
          (opt) => !initialOptionsSet.has(opt.value),
        );
        setOptions([...initialOptions, ...missingSelectedOptions]);
      } else {
        setOptions(initialOptions);
      }

      // Sync selected values with newly loaded options
      if (value && value.length > 0) {
        setSelectedOptions((prev) => {
          const updated = [...prev];
          value.forEach((val) => {
            if (!updated.find((opt) => opt.value === val)) {
              const found = initialOptions.find((opt) => opt.value === val);
              if (found) {
                updated.push(found);
              }
            }
          });
          return updated;
        });
      }
    }
  }, [initialData, defaultData, mapToOptions, value]);

  useEffect(() => {
    if (searchedData && isSearchModeRef.current) {
      // When in search mode, always replace with searched data (which is already accumulated)
      const newOptions = mapToOptions(searchedData);
      setOptions(newOptions);
    }
  }, [searchedData, mapToOptions]);

  // Sync selectedOptions when value or options change - preserve existing selected options
  useEffect(() => {
    if (value && value.length > 0) {
      // Use functional update to avoid having selectedOptions in dependency array
      setSelectedOptions((prevSelectedOptions) => {
        const updatedSelectedOptions: TOption[] = [];

        value.forEach((val) => {
          // Priority: 1. existing selectedOptions, 2. current options, 3. defaultData
          const existingSelected = prevSelectedOptions.find((opt) => opt.value === val);
          if (existingSelected) {
            updatedSelectedOptions.push(existingSelected);
          } else {
            const foundInOptions = options.find((opt) => opt.value === val);
            if (foundInOptions) {
              updatedSelectedOptions.push(foundInOptions);
            } else if (defaultData) {
              const foundInDefault = defaultData.find((opt) => opt.value === val);
              if (foundInDefault) {
                updatedSelectedOptions.push(foundInDefault);
              }
            }
          }
        });

        // Only update if there's an actual change to prevent unnecessary re-renders
        const hasChanged =
          updatedSelectedOptions.length !== prevSelectedOptions.length ||
          updatedSelectedOptions.some((opt, idx) => prevSelectedOptions[idx]?.value !== opt.value);

        return hasChanged ? updatedSelectedOptions : prevSelectedOptions;
      });
    } else if (value.length === 0) {
      setSelectedOptions((prev) => (prev.length === 0 ? prev : []));
    }
  }, [value, options, defaultData]);

  //selected options - use useMemo to ensure labels are resolved
  const values = useMemo(() => {
    if (!value || value.length === 0) return [];

    return value
      .map((item) => {
        // Try multiple sources for the label - check all sources
        const label =
          selectedOptions.find((op) => op.value === item)?.label ||
          options.find((op) => op.value === item)?.label ||
          defaultData?.find((op) => op.value === item)?.label ||
          '';

        // Only render pill if we have a label
        if (!label) return null;

        return (
          <Pill
            key={item}
            withRemoveButton
            onRemove={() => handleValueRemove(item)}
            className='overflow-hidden max-w-[100px] min-w-min'
          >
            <span className='truncate block text-sm' title={label} style={{ maxWidth: '100%' }}>
              {label}
            </span>
          </Pill>
        );
      })
      .filter(Boolean);
  }, [value, options, defaultData, selectedOptions]);

  //dropdown options
  const comboboxOptions = options?.map((item) => {
    const isSelected = value.includes(item?.value);
    return (
      <Combobox.Option value={item?.value} key={item?.value} active={isSelected}>
        <Group
          className={`${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'} py-2.5 px-3 transition-colors w-full`}
          wrap='nowrap'
          gap='xs'
        >
          <Checkbox
            color='dark'
            checked={isSelected}
            readOnly
            onChange={() => {}} // No-op handler to satisfy React warning
            className='shrink-0 cursor-pointer'
            size='sm'
          />
          <span
            className={`text-sm whitespace-normal wrap-break-word flex-1 min-w-0 ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}
          >
            {item?.label}
          </span>
        </Group>
      </Combobox.Option>
    );
  });

  // Add create option if onCreateFromSearch is provided and search doesn't match any option
  const createOption = useMemo(() => {
    if (onCreateFromSearch && search.trim()) {
      const trimmed = search.trim();
      const hasExact = options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
      if (!hasExact) {
        return (
          <Combobox.Option value='__create__' key='__create__'>
            <Group className='py-2 px-2' wrap='nowrap' gap='xs'>
              <span className='text-sm text-blue-600 whitespace-normal wrap-break-word flex-1 min-w-0'>
                Create "{trimmed}"
              </span>
            </Group>
          </Combobox.Option>
        );
      }
    }
    return null;
  }, [onCreateFromSearch, search, options]);

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    combobox.updateSelectedOptionIndex();
    const inputValue = e.currentTarget.value;
    setSearch(inputValue);
    if (inputValue && inputValue.trim()) {
      debouncedSearch(inputValue);
    } else {
      // Reset to initial data when search is cleared
      isSearchModeRef.current = false;
      currentPageRef.current = 0;
      // Call onSearch with empty string to notify parent to reset
      onSearch('');
      // Immediately update options from initialData
      const initialOptions = mapToOptions(initialData);
      // Merge selected options with initial options to ensure they're available
      if (selectedOptions.length > 0) {
        const initialOptionsSet = new Set(initialOptions.map((opt) => opt.value));
        const missingSelectedOptions = selectedOptions.filter(
          (opt) => !initialOptionsSet.has(opt.value),
        );
        setOptions([...initialOptions, ...missingSelectedOptions]);
      } else {
        setOptions(initialOptions);
      }
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && search.length === 0 && value.length > 0) {
      e.preventDefault();
      handleValueRemove(value[value.length - 1]);
    }
  }

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
      <Combobox.DropdownTarget>
        <PillsInput
          label={label}
          size='md'
          className={className || 'w-full'}
          onClick={() => combobox.openDropdown()}
          classNames={{ label: 'mb-1', error: 'text-xs!', input: 'overflow-hidden max-w-[180px]' }}
          error={error}
          styles={{
            input: {
              overflow: 'hidden',
              maxWidth: '100%',
            },
          }}
        >
          <Pill.Group
            className='flex-wrap gap-1.5'
            style={{ maxWidth: '100%', overflow: 'hidden' }}
          >
            {showSelectedValues && values && values.length > 0 && values}
            <Combobox.EventsTarget>
              <div className='flex w-full items-center min-w-0 flex-1 shrink'>
                <PillsInput.Field
                  name={name}
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => {
                    combobox.closeDropdown();
                    setTouched(true);
                  }}
                  value={search}
                  placeholder={combobox.dropdownOpened ? 'Search ...' : placeholder}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  styles={{
                    field: {
                      '--input-bd-focus': 'var(--mantine-color-gray-4)', // same as default border
                      '&:focus': {
                        boxShadow: 'none',
                      },
                      minWidth: 0,
                      flex: '1 1 0%',
                    },
                  }}
                  classNames={{ field: 'focus:outline-none! focus:ring-0! min-w-0 flex-1' }}
                  className='py-4! placeholder-text-secondary placeholder:font-medium placeholder:text-sm focus:outline-none! focus:ring-0! min-w-0 flex-1'
                />
                <ChevronDownIcon
                  className={combobox.dropdownOpened ? 'rotate-180 size-4' : 'size-4'}
                />
              </div>
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      {/*OPTIONS DROPDOWN */}
      <Combobox.Dropdown
        styles={{
          dropdown: {
            zIndex: 1000,
            width: 'var(--combobox-target-width, 100%)',
          },
        }}
      >
        <Combobox.Options
          ref={optionsContainerRef}
          className='overflow-y-auto max-h-60'
          onScroll={(e) => {
            const target = e.currentTarget;
            const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
            // Load more when within 50px of bottom
            if (scrollBottom < 50 && hasMore && !isLoadingMore && !isSearching && onLoadMore) {
              onLoadMore();
            }
          }}
        >
          {isSearching && currentPageRef.current === 0 ? (
            <div className='h-10 flex justify-center items-center'>
              <Spinner />
            </div>
          ) : (comboboxOptions && comboboxOptions?.length > 0) || createOption ? (
            <>
              {createOption}
              {comboboxOptions}
              {isLoadingMore && (
                <div className='h-10 flex justify-center items-center'>
                  <Spinner />
                </div>
              )}
            </>
          ) : (
            <Combobox.Empty>Nothing found...</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
