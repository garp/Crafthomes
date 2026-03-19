import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { IconGripVertical, IconSelector, IconX, IconPlus } from '@tabler/icons-react';
import { motion, Reorder, useDragControls } from 'framer-motion';

import CustomCheckbox from '../../base/CustomCheckbox';
import Spinner from '../loaders/Spinner';
import { cn, debounce } from '../../../utils/helper';
import type { TOption } from '../../../types/project';
import {
  useGetMasterPhasesQuery,
  useLazyGetMasterPhasesQuery,
} from '../../../store/services/masterPhase/masterPhase';

type TMasterPhaseSelectorForTaskProps = {
  value: string[];
  setValue: (val: string[]) => void;
  defaultData?: TOption[];
  error?: string | string[] | undefined;
  projectTypeId?: string;
  onCreateFromSearch?: (phaseName: string) => void;
  pendingPhaseName?: string | null;
  onPendingPhaseHandled?: () => void;
};

export default function MasterPhaseSelectorForTask({
  value,
  setValue,
  defaultData,
  error,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  projectTypeId: _projectTypeId, // kept for API compatibility
  onCreateFromSearch,
  pendingPhaseName,
  onPendingPhaseHandled,
}: TMasterPhaseSelectorForTaskProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [options, setOptions] = useState<TOption[]>([]);

  // Fetch ALL phases (no projectTypeId filter - user wants all phases as options)
  const { data: allMasterPhases, isLoading: isLoadingPhases } = useGetMasterPhasesQuery({
    pageLimit: '100',
  });

  const [getSearchedMasterPhases, { data: searchedPhases, isFetching: isSearchingPhases }] =
    useLazyGetMasterPhasesQuery();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const processedPhaseIdsRef = useRef<Set<string>>(new Set());

  // Update parent value when options change
  const updateValue = useCallback(
    (opts: TOption[]) => {
      const filtered = opts?.filter((o) => o.checked === true)?.map((opt) => opt.value);
      setValue(filtered);
    },
    [setValue],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value);
    if (e.target.value.trim() === '') return;
    debouncedSearch(e.target.value);
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(
        (query: string) =>
          getSearchedMasterPhases({
            search: query,
          }),
        500,
      ),
    [getSearchedMasterPhases],
  );

  function handleCloseSearchOptions() {
    setSearchValue('');
    setIsOpenDropdown(true);
  }

  // Check if exact match exists in search results
  const hasExactMatch = searchedPhases?.masterPhases?.some(
    (phase) => phase.name.toLowerCase() === searchValue.trim().toLowerCase(),
  );

  // Check if we should show create option
  const shouldShowCreate = onCreateFromSearch && searchValue.trim() && !hasExactMatch;

  // Initialize options
  useEffect(() => {
    if (isInitialized || !allMasterPhases?.masterPhases) return;

    let filteredPhases: TOption[] = [];

    // If we have default data (editing mode)
    if (defaultData && defaultData.length > 0) {
      const defaultIds = new Set(defaultData.map((p) => p.value));
      const defaults = defaultData.map((phase) => ({
        label: phase.label,
        value: phase.value,
        checked: true,
      }));
      const phasesWhichAreNotInDefault = allMasterPhases.masterPhases
        .filter((phase) => !defaultIds.has(phase.id))
        .map((phase) => ({
          label: phase.name,
          value: phase.id,
          checked: false,
        }));

      filteredPhases = [...defaults, ...phasesWhichAreNotInDefault];
    } else {
      // Creating new - check if value has pre-selected phases
      const selectedIds = new Set(value);
      filteredPhases =
        allMasterPhases.masterPhases.map((phase) => ({
          label: phase.name,
          value: phase.id,
          checked: selectedIds.has(phase.id),
        })) || [];
    }

    processedPhaseIdsRef.current = new Set(allMasterPhases.masterPhases.map((p) => p.id));

    setOptions(filteredPhases);
    setIsInitialized(true);
  }, [allMasterPhases, defaultData, isInitialized, value]);

  // Sync new phases and handle pending phase name
  useEffect(() => {
    if (!isInitialized || !allMasterPhases?.masterPhases) return;

    setOptions((prev) => {
      const currentIds = new Set(prev.map((o) => o.value));

      const newPhases = allMasterPhases.masterPhases.filter(
        (phase) => !currentIds.has(phase.id) && !processedPhaseIdsRef.current.has(phase.id),
      );

      const updatedPhases = allMasterPhases.masterPhases.filter((phase) => {
        const existingOption = prev.find((opt) => opt.value === phase.id);
        return existingOption && existingOption.label !== phase.name;
      });

      let updated = prev.map((opt) => {
        const updatedPhase = updatedPhases.find((p) => p.id === opt.value);
        if (updatedPhase) {
          return { ...opt, label: updatedPhase.name };
        }
        return opt;
      });

      if (newPhases.length > 0) {
        const newOptions = newPhases.map((phase) => {
          const shouldAutoSelect =
            pendingPhaseName &&
            phase.name.toLowerCase().trim() === pendingPhaseName.toLowerCase().trim();

          return {
            label: phase.name,
            value: phase.id,
            checked: !!shouldAutoSelect,
          };
        });

        updated = [...newOptions, ...updated];

        if (newOptions.some((o) => o.checked)) {
          const filtered = updated.filter((o) => o.checked).map((o) => o.value);
          setValue(filtered);
        }

        if (pendingPhaseName && newOptions.some((o) => o.checked)) {
          onPendingPhaseHandled?.();
        }

        newPhases.forEach((phase) => {
          processedPhaseIdsRef.current.add(phase.id);
        });
      }

      if (newPhases.length > 0 || updatedPhases.length > 0) {
        return updated;
      }

      return prev;
    });
  }, [allMasterPhases, isInitialized, pendingPhaseName, onPendingPhaseHandled, setValue]);

  // Update value when dropdown closes
  const prevDropdownStateRef = useRef(isOpenDropdown);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (prevDropdownStateRef.current && !isOpenDropdown && isInitialized) {
      updateValue(optionsRef.current);
    }
    prevDropdownStateRef.current = isOpenDropdown;
  }, [isOpenDropdown, isInitialized, updateValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenDropdown(false);
        setSearchValue('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoadingPhases) {
    return (
      <div className='relative'>
        <div className='w-full flex items-center justify-center border rounded-md py-4 border-gray-300'>
          <Spinner className='size-5 text-primary' />
          <span className='ml-2 text-sm text-gray-500'>Loading phases...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='relative'>
      <div ref={dropdownRef}>
        <button
          type='button'
          onClick={() => setIsOpenDropdown(true)}
          className={cn(
            'w-full flex flex-col border rounded-md py-2 pr-2 pl-3 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary',
            error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400',
          )}
        >
          {/* SELECTED OPTIONS */}
          {options?.some((op) => op.checked) && (
            <div className='flex gap-1.5 flex-wrap mb-1.5'>
              {options
                ?.filter((o) => o.checked)
                .map((opt) => (
                  <SelectedOption key={opt.value} option={opt} setOptions={setOptions} />
                ))}
            </div>
          )}

          <div className='w-full flex items-center gap-1'>
            <input
              value={searchValue}
              onChange={handleChange}
              placeholder='Search phases...'
              className={cn(
                'focus:outline-none text-sm w-full placeholder:text-gray-400',
                error ? 'placeholder:text-red-400' : '',
              )}
            />
            {searchValue && (
              <IconX
                onClick={handleCloseSearchOptions}
                className='size-4 text-gray-400 cursor-pointer hover:text-gray-600 shrink-0'
              />
            )}
            <IconSelector
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenDropdown((prev) => !prev);
              }}
              className='text-gray-400 size-4 shrink-0'
            />
          </div>
        </button>
        {error && <p className='text-xs text-red-400 mt-1'>{error}</p>}

        {/* SEARCH DROPDOWN */}
        {searchValue ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className='bg-white absolute mt-1 py-2 w-full rounded-md border shadow-lg z-20 max-h-64 overflow-y-auto'
          >
            {isSearchingPhases ? (
              <div className='flex items-center justify-center py-4'>
                <Spinner className='size-5 text-primary' />
              </div>
            ) : (
              <>
                {shouldShowCreate && (
                  <button
                    type='button'
                    onClick={() => {
                      onCreateFromSearch?.(searchValue.trim());
                      setSearchValue('');
                    }}
                    className='w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-50 transition-colors text-primary font-medium'
                  >
                    <IconPlus className='size-4' />
                    <span>Create "{searchValue.trim()}"</span>
                  </button>
                )}
                {searchedPhases?.masterPhases?.map((phase) => (
                  <SearchOptionComp
                    key={phase?.id}
                    option={{
                      label: phase?.name,
                      value: phase?.id,
                      checked: options.find((opt) => opt.value === phase?.id)?.checked || false,
                    }}
                    options={options}
                    setOptions={setOptions}
                  />
                ))}
                {searchedPhases?.totalCount === 0 && !shouldShowCreate && (
                  <p className='px-3 py-2 text-sm text-gray-500'>No results found.</p>
                )}
              </>
            )}
          </motion.div>
        ) : (
          isOpenDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className='absolute w-full z-20'
            >
              <div className='border shadow-lg bg-white mt-1 py-2 rounded-md max-h-72 overflow-y-auto'>
                {options?.length === 0 ? (
                  <p className='px-3 py-2 text-sm text-gray-500 text-center'>
                    No phases available. {onCreateFromSearch && 'Type to create one.'}
                  </p>
                ) : (
                  <Reorder.Group
                    axis='y'
                    values={options?.map((o) => o.value)}
                    onReorder={(newOrder: string[]) => {
                      setOptions(newOrder?.map((val) => options.find((o) => o.value === val)!));
                    }}
                  >
                    {options?.map((option) => (
                      <OptionComp
                        key={option.value}
                        option={option}
                        options={options}
                        setOptions={setOptions}
                      />
                    ))}
                  </Reorder.Group>
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
}: {
  option: TOption;
  options: TOption[];
  setOptions: Dispatch<SetStateAction<TOption[]>>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useDragControls();

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.stopPropagation();
    (e.currentTarget as HTMLElement).style.touchAction = 'none';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
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
    setOptions(
      options.map((opt) =>
        opt.value === option.value ? { ...opt, checked: e.target.checked } : opt,
      ),
    );
  }

  return (
    <Reorder.Item
      value={option.value}
      dragListener={false}
      dragControls={controls}
      className={cn(
        'select-none flex items-center gap-2 px-2.5 py-1.5 cursor-default transition-colors',
        isDragging ? 'bg-gray-100' : 'hover:bg-gray-50',
      )}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
        className='cursor-grab active:cursor-grabbing'
        aria-hidden
      >
        <IconGripVertical className='text-gray-400 size-4' />
      </div>

      <CustomCheckbox checked={option.checked} onChange={handleCheckChange} />
      <p className='text-gray-700 text-sm truncate flex-1'>{option.label}</p>
    </Reorder.Item>
  );
}

/* ---------------- SearchOptionComp ---------------- */
function SearchOptionComp({
  option,
  setOptions,
  options,
}: {
  option: TOption;
  options: TOption[];
  setOptions: Dispatch<SetStateAction<TOption[]>>;
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
    <div className='select-none flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-gray-50'>
      <CustomCheckbox checked={option.checked} onChange={handleCheckChange} />
      <p className='text-gray-700 text-sm truncate flex-1'>{option.label}</p>
    </div>
  );
}

/* ---------------- SelectedOption ---------------- */
function SelectedOption({
  option,
  setOptions,
}: {
  option: TOption;
  setOptions: Dispatch<SetStateAction<TOption[]>>;
}) {
  return (
    <div className='flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-medium'>
      <span className='truncate max-w-32'>{option.label}</span>
      <IconX
        size={12}
        className='cursor-pointer hover:text-primary/70 shrink-0'
        onClick={(e) => {
          e.stopPropagation();
          setOptions((prev) =>
            prev.map((opt) => (opt.value === option.value ? { ...opt, checked: false } : opt)),
          );
        }}
      />
    </div>
  );
}
