import { useState } from 'react';
import { Combobox, TextInput, useCombobox } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

type TFormComboboxProps = {
  data: string[];
  placeholder?: string;
  className?: string;
};

export default function FormCombobox({ data, placeholder, className }: TFormComboboxProps) {
  const combobox = useCombobox();
  const [value, setValue] = useState('');
  const shouldFilterOptions = !data.some((item) => item === value);
  const filteredOptions = shouldFilterOptions
    ? data.filter((item) => item.toLowerCase().includes(value.toLowerCase().trim()))
    : data;

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      onOptionSubmit={(optionValue) => {
        setValue(optionValue);
        combobox.closeDropdown();
      }}
      store={combobox}
    >
      <Combobox.Target>
        <div className={`flex items-center border border-gray-300 rounded-md pr-3 ${className}`}>
          <TextInput
            classNames={{ root: 'w-full' }}
            placeholder={placeholder}
            value={value}
            styles={{
              input: {
                border: '0px',
                paddingTop: '21px',
                paddingBottom: '21px',
                fontSize: '14px',
                fontWeight: 500,
                '&:focus': {
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                },
              },
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => combobox.closeDropdown()}
          />
          <IconSearch className='text-gray-400 size-5' />
        </div>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length === 0 ? <Combobox.Empty>Nothing found</Combobox.Empty> : options}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
