import React, {
  useCallback,
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
// import { useGetProjectTypesQuery } from '../../store/services/projectType/projectTypeSlice';
import {
  useGetMasterPhasesQuery,
  useLazyGetMasterPhasesQuery,
  useAddMasterPhaseMutation,
} from '../../store/services/masterPhase/masterPhase';
import Spinner from '../common/loaders/Spinner';
import { IconPlus } from '@tabler/icons-react';
import { toast } from 'react-toastify';

type TProjectPhaseSelectorProps = {
  setPhases: (val: string[]) => void;
  defaultPhases?: { id: string; name: string }[];
  error?: string | string[] | undefined;
  phases?: string[];
  options: TOption[];
  setOptions: Dispatch<SetStateAction<TOption[]>>;
  /** Phase name that was just created via sidebar - should be auto-selected */
  pendingPhaseName?: string | null;
  /** Called after the pending phase has been handled */
  onPendingPhaseHandled?: () => void;
  /** Called when user wants to create a new phase from search */
  onCreateFromSearch?: (search: string) => void;
  /** Called when user clicks on an existing phase to edit it */
  onPhaseClick?: (phaseId: string) => void;
};

export default function ProjectPhaseSelector({
  setPhases,
  defaultPhases,
  error,
  options,
  setOptions,
  pendingPhaseName,
  onPendingPhaseHandled,
  onCreateFromSearch,
  onPhaseClick,
}: TProjectPhaseSelectorProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isOpenSearchDropdown, setIsOpenSearchDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch all master phases - single query for all phases
  const {
    data: allMasterPhases,
    isLoading: isLoadingPhases,
    refetch: refetchMasterPhases,
  } = useGetMasterPhasesQuery({
    pageLimit: '100',
  });

  const [getSearchedMasterPhases, { data: searchedPhases, isFetching: isSearchingPhases }] =
    useLazyGetMasterPhasesQuery();
  const [createPhase, { isLoading: isCreatingPhase }] = useAddMasterPhaseMutation();

  const dropdownRef = useRef<HTMLDivElement>(null);
  // Track which phase IDs have already been processed to prevent unnecessary updates
  const processedPhaseIdsRef = useRef<Set<string>>(new Set());

  // Memoize updatePhases to avoid stale closures
  const updatePhases = useCallback(
    (opts: TOption[]) => {
      const filtered = opts?.filter((o) => o.checked === true)?.map((opt) => opt.value);
      setPhases(filtered);
    },
    [setPhases],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value);
    if (e.target.value.trim() === '') return;
    debouncedSearch(e.target.value);
  }
  const debouncedSearch = useMemo(
    () => debounce((query: string) => getSearchedMasterPhases({ search: query }), 500),
    [getSearchedMasterPhases],
  );
  function handleCloseSearchOptions() {
    setSearchValue('');
    setIsOpenDropdown(true);
  }

  async function handleCreateFromSearch() {
    if (!searchValue.trim()) return;

    const phaseName = searchValue.trim();

    // Create the phase
    try {
      await createPhase({
        name: phaseName,
        description: '',
        masterTasks: [],
      }).unwrap();

      toast.success('Phase created successfully');

      // Wait a bit for cache invalidation to complete, then find and open the phase
      setTimeout(async () => {
        try {
          // Refetch to get the newly created phase
          const { data: refetchedData } = await refetchMasterPhases();
          const newPhase = refetchedData?.masterPhases?.find(
            (p) => p.name.toLowerCase() === phaseName.toLowerCase(),
          );

          if (newPhase?.id && onPhaseClick) {
            // Open the phase form in edit mode
            onPhaseClick(newPhase.id);
          } else if (onCreateFromSearch) {
            // Fallback to original behavior if onPhaseClick is not available
            onCreateFromSearch(phaseName);
          }
        } catch (error) {
          console.error('Error finding created phase:', error);
          // Fallback to original behavior
          if (onCreateFromSearch) {
            onCreateFromSearch(phaseName);
          }
        }
      }, 500);

      setSearchValue('');
    } catch (error: any) {
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else {
        toast.error('Unable to create phase');
      }
      console.error('Error creating phase:', error);
    }
  }

  // Check if exact match exists in search results
  const hasExactMatch = searchedPhases?.masterPhases?.some(
    (phase) => phase.name.toLowerCase() === searchValue.trim().toLowerCase(),
  );

  // Check if we should show create option
  const shouldShowCreate = onCreateFromSearch && searchValue.trim() && !hasExactMatch;

  //setting initial options - only run once when data is available
  useEffect(() => {
    if (isInitialized || !allMasterPhases?.masterPhases) return;

    let filteredPhases: TOption[] = [];

    // While updating phases when there are already phases present
    if (defaultPhases && defaultPhases.length > 0) {
      const defaultIds = new Set(defaultPhases.map((p) => p.id));
      const defaults = defaultPhases.map((phase) => ({
        label: phase.name,
        value: phase.id,
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
    }
    // While creating new
    else {
      filteredPhases =
        allMasterPhases.masterPhases.map((phase) => ({
          label: phase.name,
          value: phase.id,
          checked: false,
        })) || [];
    }

    // Initialize processed phases ref with all current phases
    processedPhaseIdsRef.current = new Set(allMasterPhases.masterPhases.map((p) => p.id));

    setOptions(filteredPhases);
    setPhases(filteredPhases.filter((o) => o.checked).map((o) => o.value));
    setIsInitialized(true);
  }, [allMasterPhases, defaultPhases, isInitialized, setOptions, setPhases]);

  // Sync new phases added via sidebar and update existing phase names (cache invalidation causes refetch)
  // If there's a pending phase name (created via sidebar), auto-select it
  useEffect(() => {
    if (!isInitialized || !allMasterPhases?.masterPhases) return;

    setOptions((prev) => {
      const currentIds = new Set(prev.map((o) => o.value));

      // Check for newly added phases that aren't in current options
      const newPhases = allMasterPhases.masterPhases.filter(
        (phase) => !currentIds.has(phase.id) && !processedPhaseIdsRef.current.has(phase.id),
      );

      // Check for updated phase names (phases that exist in both current options and refetched data)
      const updatedPhases = allMasterPhases.masterPhases.filter((phase) => {
        const existingOption = prev.find((opt) => opt.value === phase.id);
        return existingOption && existingOption.label !== phase.name;
      });

      // Update existing phase names
      let updated = prev.map((opt) => {
        const updatedPhase = updatedPhases.find((p) => p.id === opt.value);
        if (updatedPhase) {
          return { ...opt, label: updatedPhase.name };
        }
        return opt;
      });

      // Add new phases if any
      if (newPhases.length > 0) {
        const newOptions = newPhases.map((phase) => {
          // Auto-select if this is the pending phase from sidebar
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
        // Update formik if any new phase was auto-selected
        if (newOptions.some((o) => o.checked)) {
          const filtered = updated.filter((o) => o.checked).map((o) => o.value);
          setPhases(filtered);
        }

        // Clear the pending phase name after handling
        if (pendingPhaseName && newOptions.some((o) => o.checked)) {
          onPendingPhaseHandled?.();
        }

        // Track processed phases to prevent reprocessing
        newPhases.forEach((phase) => {
          processedPhaseIdsRef.current.add(phase.id);
        });
      }

      // Return updated options if there were changes, otherwise return prev
      if (newPhases.length > 0 || updatedPhases.length > 0) {
        return updated;
      }

      return prev;
    });
  }, [
    allMasterPhases,
    isInitialized,
    pendingPhaseName,
    onPendingPhaseHandled,
    setPhases,
    setOptions,
  ]);

  //setting project phases in formik when the dropdown closes
  // Use ref to track previous dropdown state to avoid unnecessary updates
  const prevDropdownStateRef = useRef(isOpenDropdown);
  const optionsRef = useRef(options);

  // Keep ref in sync with options
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    // Only update when dropdown transitions from open to closed
    if (prevDropdownStateRef.current && !isOpenDropdown && isInitialized) {
      updatePhases(optionsRef.current);
    }
    prevDropdownStateRef.current = isOpenDropdown;
  }, [isOpenDropdown, isInitialized, updatePhases]);
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
  // Show loading state while fetching initial data
  if (isLoadingPhases) {
    return (
      <div className='relative w-120'>
        <FormLabel>Project Phases</FormLabel>
        <div className='mt-2 w-full flex items-center justify-center border rounded-sm py-6 border-gray-300'>
          <Spinner className='size-5 text-primary' />
          <span className='ml-2 text-sm text-gray-500'>Loading phases...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='relative w-120'>
      <FormLabel>Project Phases</FormLabel>
      <div ref={dropdownRef} className='mt-2'>
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
                  <SelectedOption
                    option={opt}
                    key={opt.value}
                    setOptions={setOptions}
                    options={options}
                  />
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
        {error && <p className='text-xs text-red-400 mt-1 '>{error}</p>}
        {/* SEARCHABLE */}
        {searchValue || isOpenSearchDropdown ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className='bg-white absolute mt-1 py-2 w-full rounded-md border shadow-lg z-20 max-h-64 overflow-y-auto'
          >
            {isSearchingPhases || isCreatingPhase ? (
              <div className='flex items-center justify-center py-4'>
                <Spinner className='size-5 text-primary' />
              </div>
            ) : (
              <>
                {/* Create option - show if onCreateFromSearch exists and search doesn't match any option */}
                {shouldShowCreate && (
                  <button
                    type='button'
                    onClick={handleCreateFromSearch}
                    disabled={isCreatingPhase}
                    className='w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-50 transition-colors text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <IconPlus className='size-4' />
                    <span>Create &quot;{searchValue.trim()}&quot;</span>
                  </button>
                )}
                {/* Search results */}
                {searchedPhases?.masterPhases?.map((phase) => (
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
                    onPhaseClick={onPhaseClick}
                    phaseId={phase?.id}
                  />
                ))}
                {searchedPhases?.totalCount === 0 && !shouldShowCreate && (
                  <p className='px-3 py-2 text-sm text-gray-500'>No results found.</p>
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
              className='absolute w-full z-20'
            >
              <div className='border shadow-lg bg-white mt-1 py-2 rounded-md max-h-72 overflow-y-auto'>
                {options?.length === 0 ? (
                  <p className='px-3 py-2 text-sm text-gray-500 text-center'>
                    No phases available. Create one using the search input above.
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
                        options={options}
                        setOptions={setOptions}
                        key={option.value}
                        option={option}
                        onPhaseClick={onPhaseClick}
                        phaseId={option.value}
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
  onPhaseClick,
  phaseId,
}: TOptionCompProps & {
  onPhaseClick?: (phaseId: string) => void;
  phaseId?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useDragControls();

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
      {/* Grip handle: only this starts the drag */}
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

      {/* checkbox and label remain normal clickable areas */}
      <CustomCheckbox checked={option.checked} onChange={handleCheckChange} />
      <p
        className='text-gray-700 text-sm truncate flex-1 cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          if (onPhaseClick && phaseId) {
            onPhaseClick(phaseId);
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
  onPhaseClick,
  phaseId,
}: TOptionCompProps & {
  onPhaseClick?: (phaseId: string) => void;
  phaseId?: string;
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
    <div
      className={cn(
        'select-none flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-gray-50',
      )}
    >
      <CustomCheckbox checked={option.checked} onChange={handleCheckChange} />
      <p
        className='text-gray-700 text-sm truncate flex-1'
        onClick={(e) => {
          e.stopPropagation();
          if (onPhaseClick && phaseId) {
            onPhaseClick(phaseId);
          }
        }}
      >
        {option.label}
      </p>
    </div>
  );
}

/* ---------------- SelectedOption ---------------- */
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
    <div
      key={option.value}
      className='flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-medium'
    >
      <span className='truncate max-w-32'>{option.label}</span>
      <IconX
        size={12}
        className='cursor-pointer hover:text-primary/70 shrink-0'
        onClick={(e) => {
          e.stopPropagation();
          setOptions(
            options.map((opt) => (opt.value === option.value ? { ...opt, checked: false } : opt)),
          );
        }}
      />
    </div>
  );
}
