import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { IconGripVertical, IconSelector, IconX } from '@tabler/icons-react';
import { motion, Reorder, useDragControls } from 'framer-motion';

import FormLabel from '../base/FormLabel';
import CustomCheckbox from '../base/CustomCheckbox';

import { cn, debounce } from '../../utils/helper';
import type { TOption, TOptionCompProps } from '../../types/project';
import Spinner from '../common/loaders/Spinner';

type TProjectPhaseSelectorProps<T> = {
  setValue: (val: string[]) => void;
  error?: string | string[] | undefined;
  options: TOption[];
  setOptions: Dispatch<SetStateAction<TOption[]>>;
  searchedData?: T;
  disabled?: boolean;
  onSearch: (q: string) => void;
  searchedTotalCount: number;
  label: string;
  mapToOptions: (data: T | undefined) => { id: string; name: string }[];
  className?: string;
  onCreateFromSearch?: (search: string) => void;
  onTaskClick?: (taskId: string) => void;
  noOptionsPlaceholder?: string;
  // defaultData?: T;
  // initialData?: T;
  // value: string[];
};

export default function DraggableCombobox<T>({
  setValue,
  error,
  options,
  setOptions,
  searchedData,
  disabled,
  onSearch,
  searchedTotalCount,
  mapToOptions,
  label,
  className,
  onCreateFromSearch,
  onTaskClick,
  noOptionsPlaceholder = 'No tasks available.',
  // isSubmitting,
  // submitCount,
  //   initialData,
  //   defaultData,
  //   mapOptionsExcludingDefault,
}: TProjectPhaseSelectorProps<T>) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isOpenSearchDropdown, setIsOpenSearchDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value);
    if (e.target.value.trim() === '') return;
    debouncedSearch(e.target.value);
  }
  const debouncedSearch = useMemo(() => debounce((query: string) => onSearch(query), 500), []);
  function handleCloseSearchOptions() {
    setSearchValue('');
    setIsOpenDropdown(true);
  }

  // setting project phases in formik when the dropdown closes

  useEffect(() => {
    if (!isOpenDropdown) {
      const filtered = options?.filter((o) => o.checked === true)?.map((opt) => opt.value);
      setValue(filtered);
    }
  }, [isOpenDropdown]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenDropdown(false);
        setIsOpenSearchDropdown(false);
        setSearchValue('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className={cn('relative', className)}>
      <FormLabel>{label}</FormLabel>
      <div ref={dropdownRef} className='mt-1'>
        <button
          type='button'
          onClick={() => setIsOpenDropdown(true)}
          className={cn(
            'w-full flex flex-col  border rounded-sm py-2.5 pr-2 pl-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.005]',
            error ? 'border-red-500' : 'border-gray-300',
          )}
        >
          {/* SELECTED OPTIONS */}
          {options?.some((op) => op.checked) && (
            <div className='flex gap-2 flex-wrap mb-2 '>
              {options
                ?.filter((o) => o.checked)
                .map((opt) => (
                  <SelectedOption
                    option={opt}
                    key={opt.value}
                    setOptions={setOptions}
                    options={options}
                  />
                ))}
            </div>
          )}

          <div className='w-full flex items-center'>
            <input
              value={searchValue}
              onChange={handleChange}
              placeholder='Search...'
              className={cn(
                'focus:outline-none  placeholder:text-sm w-full placeholder:font-semibold',
                error ? 'placeholder:text-red-500' : 'placeholder:text-neutral-400',
              )}
            />
            {searchValue && (
              <IconX
                onClick={handleCloseSearchOptions}
                className='size-5 text-text-subHeading cursor-pointer mr-2'
              />
            )}
            <IconSelector
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenDropdown((prev) => !prev);
              }}
              className='text-text-subHeading size-4.5'
            />
          </div>
        </button>
        {error && <p className='text-xs text-red-400 mt-1 '>{error}</p>}
        {/* SEARCHABLE */}
        {searchValue || isOpenSearchDropdown ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className='bg-white absolute mt-2 pt-3 pb-3 w-full rounded-sm border z-20'
          >
            {disabled ? (
              <Spinner className='mx-2' />
            ) : (
              <>
                {/* Create option - show if onCreateFromSearch exists and search doesn't match any option */}
                {onCreateFromSearch &&
                  searchValue.trim() &&
                  (() => {
                    const trimmed = searchValue.trim();
                    const searchedOptions = mapToOptions(searchedData) || [];
                    const hasExact = searchedOptions.some(
                      (opt) => opt.name.toLowerCase() === trimmed.toLowerCase(),
                    );
                    if (!hasExact) {
                      return (
                        <CreateOptionComp
                          searchValue={trimmed}
                          onCreateFromSearch={onCreateFromSearch}
                        />
                      );
                    }
                    return null;
                  })()}
                {/* Search results */}
                {searchedTotalCount === 0 && !onCreateFromSearch ? (
                  <p className='mx-3 text-sm text-text-secondary'>No results found.</p>
                ) : (
                  mapToOptions(searchedData)?.map((phase) => (
                    <SearchOptionComp
                      key={phase?.id}
                      setOptions={setOptions}
                      options={options}
                      option={{
                        label: phase?.name,
                        value: phase?.id,
                        checked: options
                          .filter((op) => op.checked === true)
                          .find((opt) => opt.value === phase?.id)
                          ? true
                          : false,
                      }}
                      onTaskClick={onTaskClick}
                      taskId={phase?.id}
                    />
                  ))
                )}
              </>
            )}
          </motion.div>
        ) : (
          // MAIN DRAG AND DROP DROPDOWN

          isOpenDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className='  absolute w-full z-20 pb-10'
            >
              <div className='border shadow-md bg-white mt-2 pt-3 pb-3 rounded-sm'>
                {/* Pass primitive values (string ids). Map back to objects on reorder. */}
                {options && options.length > 0 ? (
                  <Reorder.Group
                    axis='y'
                    values={options.map((o) => o.value)}
                    onReorder={(newOrder: string[]) => {
                      // stable mapping: build new options array in new order
                      setOptions(newOrder?.map((val) => options.find((o) => o.value === val)!));
                    }}
                  >
                    {options.map((option) => (
                      <OptionComp
                        options={options}
                        setOptions={setOptions}
                        key={option.value}
                        option={option}
                        onTaskClick={onTaskClick}
                        taskId={option.value}
                      />
                    ))}
                  </Reorder.Group>
                ) : (
                  <p className='mx-3 text-sm text-text-secondary py-2'>{noOptionsPlaceholder}</p>
                )}
              </div>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}

/* ---------------- OptionComp ---------------- */
function OptionComp({
  option,
  setOptions,
  options,
  onTaskClick,
  taskId,
}: TOptionCompProps & {
  onTaskClick?: (taskId: string) => void;
  taskId?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useDragControls();
  // const [checked, setChecked] = useState(option?.checked);

  // helpers for pointer capture/release (prevents lost capture on some browsers)
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    // stop propagation so parent dropdown/button doesn't get toggled
    e.stopPropagation();
    // disable browser gestures that conflict with dragging on touch
    (e.currentTarget as HTMLElement).style.touchAction = 'none';
    // try to capture pointer so move events don't get lost
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      console.log(err);
      /* ignore - some browsers/devices won't support it */
    }
    // start framer drag
    controls.start(e as unknown as PointerEvent);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  function handleCheckChange(e: React.ChangeEvent<HTMLInputElement>) {
    // setChecked(e.target.checked);
    setOptions(
      options.map((opt) =>
        opt.value === option.value ? { ...opt, checked: e.target.checked } : opt,
      ),
    );
  }
  return (
    <Reorder.Item
      value={option.value} // primitive value — avoids identity bugs
      dragListener={false} // disable whole-item drag
      dragControls={controls}
      className={cn(
        'select-none flex items-center gap-3 px-3 py-2 cursor-default',
        isDragging ? 'bg-neutral-100' : '',
      )}
    >
      {/* Grip handle: only this starts the drag */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // touchAction none prevents touch scrolling interfering with drag
        style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
        // className='cursor-grab'
        aria-hidden
      >
        <IconGripVertical className='text-text-subHeading size-5' />
      </div>

      {/* checkbox and label remain normal clickable areas */}
      <CustomCheckbox checked={option.checked} onChange={handleCheckChange} />
      <p
        className='text-text-subHeading text-sm flex-1 cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          if (onTaskClick && taskId) {
            onTaskClick(taskId);
          }
        }}
      >
        {option.label}
      </p>
    </Reorder.Item>
  );
}

/* ---------------- SearchOptionComp ---------------- */
function SearchOptionComp({
  option,
  setOptions,
  options,
  onTaskClick,
  taskId,
}: TOptionCompProps & {
  onTaskClick?: (taskId: string) => void;
  taskId?: string;
}) {
  function handleCheckChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isChecked = e.target.checked;
    setOptions(() => {
      const exists = options.find((op) => op.value === option.value);
      if (!exists) return [...options, { ...option, checked: isChecked }];
      return options.map((opt) =>
        opt.value === option.value ? { ...opt, checked: isChecked } : opt,
      );
    });
  }

  return (
    <div className={cn('select-none flex items-center gap-3 px-3 py-2 cursor-default ')}>
      <CustomCheckbox checked={option.checked} onChange={handleCheckChange} />
      <p
        className='text-text-subHeading text-sm flex-1 cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          if (onTaskClick && taskId) {
            onTaskClick(taskId);
          }
        }}
      >
        {option.label}
      </p>
    </div>
  );
}

/////SelectedOption
function SelectedOption({
  option,
  setOptions,
  options,
}: {
  option: TOption;
  setOptions: React.Dispatch<React.SetStateAction<TOption[]>>;
  options: TOption[];
}) {
  return (
    <div key={option.value} className='flex items-center gap-2 bg-bg-light px-2 py-1 rounded-full'>
      <p className='text-xs'>{option.label}</p>
      <IconX
        size={12}
        className='cursor-pointer'
        onClick={() =>
          setOptions(
            options.map((opt) => (opt.value === option.value ? { ...opt, checked: false } : opt)),
          )
        }
      />
    </div>
  );
}

/* ---------------- CreateOptionComp ---------------- */
function CreateOptionComp({
  searchValue,
  onCreateFromSearch,
}: {
  searchValue: string;
  onCreateFromSearch: (search: string) => void;
}) {
  return (
    <div
      className='select-none flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50'
      onClick={() => onCreateFromSearch(searchValue)}
    >
      <p className='text-text-subHeading text-sm font-medium'>+ Create &quot;{searchValue}&quot;</p>
    </div>
  );
}
