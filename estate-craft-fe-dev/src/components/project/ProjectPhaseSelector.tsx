import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { IconGripVertical, IconSelector, IconX } from '@tabler/icons-react';
import { motion, Reorder, useDragControls } from 'framer-motion';

import FormLabel from '../base/FormLabel';
import CustomCheckbox from '../base/CustomCheckbox';

import { cn } from '../../utils/helper';
import type { TOption, TOptionCompProps } from '../../types/project';
import { useGetPhasesByProjectTypeIdQuery } from '../../store/services/phase/phaseSlice';

export default function ProjectPhaseSelector({
  buttonOnClickHandler,
  setPhases,
  projectTypeId,
  defaultMasterPhases,
  additionalPhases = [],
  disabled,
  selectedPhaseIds,
  onPhaseClick,
}: {
  buttonOnClickHandler: () => void;
  setPhases: (val: string[]) => void;
  projectTypeId: string;
  defaultMasterPhases?: { id: string; name: string }[];
  additionalPhases?: { id: string; name: string }[];
  disabled?: boolean;
  selectedPhaseIds: string[];
  onPhaseClick?: (phaseId: string) => void;
}) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const { data: projectTypes } = useGetPhasesByProjectTypeIdQuery(
    { projectTypeId },
    { skip: !projectTypeId },
  );

  const optionsData = useMemo(() => {
    // Combine all phases from all sources
    const allPhases = [
      ...(defaultMasterPhases || []),
      ...(projectTypes?.masterPhases?.map((phase) => ({ id: phase.id, name: phase.name })) || []),
      ...additionalPhases,
    ];

    // Deduplicate by ID - use a Map to ensure uniqueness
    const phaseMap = new Map<string, { id: string; name: string }>();
    allPhases.forEach((phase) => {
      if (phase.id && !phaseMap.has(phase.id)) {
        phaseMap.set(phase.id, phase);
      }
    });

    // Return as array, preserving order: defaults first, then others
    const defaults = defaultMasterPhases || [];
    const result: { id: string; name: string }[] = [];

    // Add defaults first
    defaults.forEach((phase) => {
      if (phaseMap.has(phase.id)) {
        result.push(phaseMap.get(phase.id)!);
        phaseMap.delete(phase.id);
      }
    });

    // Add remaining phases
    phaseMap.forEach((phase) => {
      result.push(phase);
    });

    return result;
  }, [projectTypes, defaultMasterPhases, additionalPhases]);
  const [options, setOptions] = useState<TOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);
  const hasUserChangedRef = useRef(false);
  const optionsRef = useRef<TOption[]>([]);

  function arraysEqual(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  const commitSelectedPhases = useCallback(
    (nextOptions: TOption[]) => {
      // Get all checked phases, with newly selected ones first
      const checkedOptions = nextOptions.filter((o) => o.checked === true);
      const previouslySelected = new Set(selectedPhaseIds);

      // Separate newly selected from previously selected
      const newlySelected = checkedOptions.filter((opt) => !previouslySelected.has(opt.value));
      const previouslySelectedOptions = checkedOptions.filter((opt) =>
        previouslySelected.has(opt.value),
      );

      // Order: newly selected first, then previously selected in their current order
      const orderedOptions = [...newlySelected, ...previouslySelectedOptions];
      const filtered = orderedOptions.map((opt) => opt.value);

      if (!arraysEqual(filtered, selectedPhaseIds)) {
        setPhases(filtered);
      }
    },
    [selectedPhaseIds, setPhases],
  );

  // Keep optionsRef in sync with options
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Sync options whenever source data or selection changes without re-triggering setPhases loops
  useEffect(() => {
    // Create a map to deduplicate by ID (in case of duplicates)
    const phaseMap = new Map<string, { id: string; name: string }>();
    optionsData?.forEach((phase) => {
      if (!phaseMap.has(phase.id)) {
        phaseMap.set(phase.id, phase);
      }
    });

    // Build nextOptions from the deduplicated map
    const nextOptions = Array.from(phaseMap.values()).map((phase) => ({
      label: phase.name,
      value: phase.id,
      checked: selectedPhaseIds.includes(phase.id),
    }));

    // Get current options from ref to avoid dependency issues
    const currentOptions = optionsRef.current;

    // Only update if there are actual changes (check by ID set, not just order)
    const currentIds = new Set(currentOptions.map((o) => o.value));
    const nextIds = new Set(nextOptions.map((o) => o.value));
    const idsChanged =
      currentIds.size !== nextIds.size ||
      Array.from(currentIds).some((id) => !nextIds.has(id)) ||
      Array.from(nextIds).some((id) => !currentIds.has(id));

    // Check if checked states changed
    const checkedStatesChanged =
      currentOptions.some(
        (opt) => opt.checked !== nextOptions.find((n) => n.value === opt.value)?.checked,
      ) ||
      nextOptions.some(
        (opt) => opt.checked !== currentOptions.find((o) => o.value === opt.value)?.checked,
      );

    // Only update if IDs changed or checked states changed (preserve user's manual ordering)
    if (idsChanged || checkedStatesChanged) {
      // If user hasn't manually changed order, use the new order
      // Otherwise, preserve current order and update checked states
      if (!hasUserChangedRef.current) {
        // Final deduplication safeguard
        const deduplicated = Array.from(
          new Map(nextOptions.map((opt) => [opt.value, opt])).values(),
        );
        setOptions(deduplicated);
      } else {
        // Preserve order but update checked states and add/remove items
        const currentOrder = currentOptions.map((o) => o.value);
        const newOrder: TOption[] = [];
        const processedIds = new Set<string>();

        // First, add items in current order (if they still exist)
        currentOrder.forEach((id) => {
          const nextOpt = nextOptions.find((n) => n.value === id);
          if (nextOpt && !processedIds.has(id)) {
            newOrder.push(nextOpt);
            processedIds.add(id);
          }
        });

        // Then, add any new items that weren't in the current order
        nextOptions.forEach((opt) => {
          if (!processedIds.has(opt.value)) {
            newOrder.push(opt);
            processedIds.add(opt.value);
          }
        });

        setOptions(newOrder);
      }
    }
  }, [optionsData, selectedPhaseIds]);

  const handleCloseDropdown = useCallback(() => {
    if (prevOpenRef.current && hasUserChangedRef.current) {
      commitSelectedPhases(optionsRef.current);
    }
    hasUserChangedRef.current = false;
    prevOpenRef.current = false;
    setIsOpenDropdown(false);
  }, [commitSelectedPhases]);

  //for closing the dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        handleCloseDropdown();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleCloseDropdown]);

  function handleToggleDropdown() {
    if (isOpenDropdown) {
      handleCloseDropdown();
    } else {
      prevOpenRef.current = true;
      setIsOpenDropdown(true);
    }
  }
  const [searchValue, setSearchValue] = useState('');
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value);
  }
  return (
    <div className='relative'>
      <div className='flex items-center justify-between'>
        <FormLabel>Project Phases</FormLabel>
        <button
          type='button'
          onClick={buttonOnClickHandler}
          disabled={disabled}
          className='text-primary text-xs! disabled:text-gray-300 disabled:no-underline'
        >
          + Create Phase
        </button>
      </div>
      <div ref={dropdownRef}>
        <button
          type='button'
          onClick={() => !disabled && handleToggleDropdown()}
          className={cn(
            'w-full flex flex-col border rounded-sm py-2.5 pr-2 pl-3',
            disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300',
          )}
        >
          {/* SELECTED OPTIONS */}
          {options?.some((op) => op.checked) && (
            <div className='flex gap-2 flex-wrap mb-2'>
              {options
                ?.filter((o) => o.checked)
                .map((opt) => (
                  <SelectedOption
                    option={opt}
                    key={opt.value}
                    setOptions={setOptions}
                    options={options}
                    commitSelectedPhases={commitSelectedPhases}
                  />
                ))}
            </div>
          )}

          <div className='w-full flex items-center'>
            <input
              value={searchValue}
              onChange={handleChange}
              placeholder='Project Phase drop down'
              className='focus:outline-none cursor-pointer placeholder:text-sm w-full placeholder:font-semibold placeholder:text-neutral-400'
            />
            <IconSelector className='text-text-subHeading size-4' />
          </div>
        </button>

        {isOpenDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className='bg-white min-h-12 absolute mt-2 pt-3 pb-3 w-full rounded-sm border z-20'
          >
            {/* Pass primitive values (string ids). Map back to objects on reorder. */}
            <Reorder.Group
              axis='y'
              values={options?.length > 0 ? options.map((o) => o.value) : []}
              onReorder={(newOrder: string[]) => {
                // stable mapping: build new options array in new order
                hasUserChangedRef.current = true;
                const reorderedOptions = newOrder
                  .map((val) => options.find((o) => o.value === val))
                  .filter((opt): opt is TOption => opt !== undefined);
                setOptions(reorderedOptions);
              }}
            >
              {options.length === 0 ? (
                <p className='text-center text-sm text-text-secondary'>No Phases found.</p>
              ) : (
                options?.map((option) => (
                  <OptionComp
                    options={options}
                    setOptions={setOptions}
                    key={option.value}
                    option={option}
                    markUserChanged={() => {
                      hasUserChangedRef.current = true;
                    }}
                    commitSelectedPhases={commitSelectedPhases}
                    onPhaseClick={onPhaseClick}
                    phaseId={option.value}
                  />
                ))
              )}
            </Reorder.Group>
          </motion.div>
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
  markUserChanged,
  commitSelectedPhases,
  onPhaseClick,
  phaseId,
}: TOptionCompProps & {
  markUserChanged: () => void;
  commitSelectedPhases: (nextOptions: TOption[]) => void;
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
    markUserChanged();
    const isChecked = e.target.checked;
    let nextOptions: TOption[];

    if (isChecked) {
      // When checking: move the selected phase to the first position
      const updatedOption = { ...option, checked: true };
      const otherOptions = options.filter((opt) => opt.value !== option.value);
      nextOptions = [updatedOption, ...otherOptions];
    } else {
      // When unchecking: just update the checked state, keep position
      nextOptions = options.map((opt) =>
        opt.value === option.value ? { ...opt, checked: false } : opt,
      );
    }

    setOptions(nextOptions);
    // Commit immediately so parent Formik state is updated even if dropdown stays open
    commitSelectedPhases(nextOptions);
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

/* ---------------- SelectedOption ---------------- */
function SelectedOption({
  option,
  setOptions,
  options,
  commitSelectedPhases,
}: {
  option: TOption;
  setOptions: React.Dispatch<React.SetStateAction<TOption[]>>;
  options: TOption[];
  commitSelectedPhases: (nextOptions: TOption[]) => void;
}) {
  return (
    <div key={option.value} className='flex items-center gap-2 bg-bg-light px-2 py-1 rounded-full'>
      <p className='text-xs'>{option.label}</p>
      <IconX
        size={12}
        className='cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          const nextOptions = options.map((opt) =>
            opt.value === option.value ? { ...opt, checked: false } : opt,
          );
          setOptions(nextOptions);
          commitSelectedPhases(nextOptions);
        }}
      />
    </div>
  );
}
