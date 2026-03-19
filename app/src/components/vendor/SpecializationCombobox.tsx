import { useMemo, useState } from 'react';
import { PillsInput, Pill, Combobox, Group, useCombobox, Checkbox } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { ChevronDownIcon } from '../icons';
import {
  useGetSpecializedQuery,
  useCreateSpecializedMutation,
} from '../../store/services/specialization/specializationSlice';

// const specialization = [
//   'Visual Design',
//   'UX Research',
//   'UI Design',
//   'Graphic Design',
//   'System Design',
//   'UX Analysis',
//   'A/B Testing',
// ];

export type TSpecializationComboboxProps = {
  value: string[];
  setValue: (val: string[]) => void;
  error?: string;
};

export default function SepcializationCombobox({
  value,
  setValue,
  error,
}: TSpecializationComboboxProps) {
  const { data } = useGetSpecializedQuery();
  const [createSpecialized, { isLoading: isCreating }] = useCreateSpecializedMutation();

  const specializations = useMemo(
    () =>
      data?.specialized?.map((specialized) => ({
        label: specialized?.name,
        value: specialized?.id,
      })),
    [data],
  );

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const [search, setSearch] = useState('');
  // const [value, setValue] = useState<string[]>([]);

  const handleValueSelect = (val: string) => {
    // Check if this is a create action
    if (val.startsWith('__create__')) {
      const nameToCreate = val.replace('__create__', '');
      handleCreateSpecialization(nameToCreate);
      return;
    }

    setValue(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const handleValueRemove = (val: string) => setValue(value.filter((v) => v !== val));

  const handleCreateSpecialization = async (name: string) => {
    try {
      const result = await createSpecialized({ name }).unwrap();
      toast.success(`"${name}" created successfully`);
      setSearch('');
      combobox.closeDropdown();

      // Auto-select the newly created specialization while keeping existing selections
      if (result?.specialized?.id) {
        const newId = result.specialized.id;
        // Only add if not already in the array (safety check)
        if (!value.includes(newId)) {
          setValue([...value, newId]);
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create specialization');
      console.error('Error creating specialization:', error);
    }
  };

  const values = value?.map((item) => (
    <Pill key={item} withRemoveButton onRemove={() => handleValueRemove(item)}>
      {specializations?.find((sp) => sp.value === item)?.label}
    </Pill>
  ));

  // Filter specializations based on search
  const filteredSpecializations = specializations?.filter((item) =>
    item.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const options = filteredSpecializations?.map((item) => (
    <Combobox.Option value={item?.value} key={item?.value} active={value.includes(item?.value)}>
      <Group className={`${value.includes(item?.value) ? 'bg-gray-50' : ''} py-2 px-2`}>
        <Checkbox color='dark' checked={value.includes(item?.value)} />
        <span className='text-sm'>{item?.label}</span>
      </Group>
    </Combobox.Option>
  ));

  // Check if we should show the "Create" option
  // Always show "Create" when there is some search text (even if it already exists)
  const shouldShowCreateOption = !!search.trim();

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
      <Combobox.DropdownTarget>
        <PillsInput
          size='md'
          style={{
            input: {
              fontSize: '12px',
              fontWeight: 500,
            },
          }}
          className='w-full'
          onClick={() => combobox.openDropdown()}
          disabled={isCreating}
          classNames={{
            input: error
              ? '!border-red-500 focus-within:!border-red-500 focus-within:!ring-red-100 focus-within:!ring-2'
              : '',
          }}
        >
          <Pill.Group>
            {values}
            <Combobox.EventsTarget>
              <div className='flex w-full items-center'>
                <PillsInput.Field
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  value={search}
                  placeholder={combobox.dropdownOpened ? 'Search ...' : 'Select Specialization'}
                  onChange={(event) => {
                    combobox.updateSelectedOptionIndex();
                    setSearch(event.currentTarget.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && search.length === 0 && value.length > 0) {
                      event.preventDefault();
                      handleValueRemove(value[value.length - 1]);
                    }
                  }}
                  className='placeholder-text-secondary placeholder:font-medium placeholder:text-sm  focus:outline-none focus:ring-0'
                />
                <ChevronDownIcon
                  className={combobox.dropdownOpened ? 'rotate-180 size-4' : 'size-4'}
                />
              </div>
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options className='overflow-y-auto'>
          {/* Existing options */}
          {options && options.length > 0 && options}

          {/* "Create" option should always show when there is some search text */}
          {shouldShowCreateOption && (
            <Combobox.Option value={`__create__${search.trim()}`}>
              <Group className='py-2 px-2'>
                <IconPlus className='size-4' />
                <span className='text-sm font-medium'>Create "{search.trim()}"</span>
              </Group>
            </Combobox.Option>
          )}

          {/* When no options and no search text */}
          {!options?.length && !shouldShowCreateOption && (
            <Combobox.Empty>Nothing found...</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
