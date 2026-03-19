import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  useGetMasterPhasesQuery,
  useLazyGetMasterPhasesQuery,
} from '../../../store/services/masterPhase/masterPhase';
import DraggableCombobox from '../DraggableCombobox';
import type { TOption } from '../../../types/project';

// Helper to compare arrays of default data
function areDefaultsEqual(
  a: { id: string; name: string }[] | undefined,
  b: { id: string; name: string }[] | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item.id === b[idx].id && item.name === b[idx].name);
}

type TMasterPhaseMultiSelectorProps = {
  setValue: (val: string[]) => void;
  options: TOption[];
  setOptions: Dispatch<SetStateAction<TOption[]>>;
  defaultData?: { id: string; name: string }[];
  onCreateFromSearch?: (search: string) => void;
  pendingPhaseName?: string | null;
  onPhaseClick?: (phaseId: string) => void;
  projectTypeId?: string;
  error?: string;
};

export default function MasterPhaseMultiSelector({
  defaultData,
  setOptions,
  setValue,
  onCreateFromSearch,
  pendingPhaseName,
  options,
  onPhaseClick,
  projectTypeId,
  error,
  ...props
}: TMasterPhaseMultiSelectorProps) {
  const { data: masterPhases } = useGetMasterPhasesQuery({
    pageLimit: '100',
    ...(projectTypeId ? { projectTypeId } : {}),
  });
  const [getSearchedMasterPhases, { data: searchedData, isFetching: isSearchingPhases }] =
    useLazyGetMasterPhasesQuery();

  // Track selected phase IDs to preserve them across updates
  const selectedPhaseIdsRef = useRef<Set<string>>(new Set());
  // Track if initial setup has been done to prevent re-running
  const hasInitializedRef = useRef(false);
  // Track previous defaultData to prevent unnecessary updates
  const prevDefaultDataRef = useRef<{ id: string; name: string }[] | undefined>(undefined);

  // Setting initial options
  useEffect(() => {
    // Wait for masterPhases to be loaded
    if (!masterPhases?.masterPhases) return;

    // Check if defaultData has actually changed to prevent infinite loops
    const defaultDataChanged = !areDefaultsEqual(defaultData, prevDefaultDataRef.current);
    const hasPendingPhase = !!pendingPhaseName;

    // Skip if already initialized and no meaningful change
    if (hasInitializedRef.current && !defaultDataChanged && !hasPendingPhase) {
      return;
    }

    let filteredPhases: TOption[] = [];
    // Get currently selected phase IDs from ref to preserve them
    const currentlySelectedIds = selectedPhaseIdsRef.current;

    // While updating when there are already phases present
    if (defaultData && defaultData.length > 0) {
      const defaults = defaultData?.map((phase) => ({
        label: phase?.name,
        value: phase?.id,
        checked: true,
      }));
      const phasesWhichAreNotInDefault = masterPhases?.masterPhases
        ?.filter((phase) => phase?.id !== defaults?.find((p) => p.value === phase?.id)?.value)
        .map((phase) => ({
          label: phase?.name,
          value: phase?.id,
          checked: currentlySelectedIds.has(phase.id), // Preserve if already selected
        }));

      filteredPhases = defaults.concat(phasesWhichAreNotInDefault);
    }
    // While creating new
    else {
      filteredPhases =
        masterPhases?.masterPhases?.map((phase) => ({
          label: phase?.name,
          value: phase?.id,
          checked: currentlySelectedIds.has(phase.id), // Preserve if already selected
        })) || [];
    }

    // If we have a pending phase name, find and auto-select it
    if (pendingPhaseName) {
      const newPhase = filteredPhases.find(
        (phase) => phase.label.toLowerCase() === pendingPhaseName.toLowerCase(),
      );
      if (newPhase && !newPhase.checked) {
        // Mark the new phase as checked and add it to selected
        filteredPhases = filteredPhases.map((phase) =>
          phase.value === newPhase.value ? { ...phase, checked: true } : phase,
        );
        // Update the ref to include the new phase
        currentlySelectedIds.add(newPhase.value);
      }
    }

    const selectedIds = filteredPhases?.filter((o) => o.checked).map((o) => o.value);
    // Update ref with final selected IDs to preserve them for next update
    selectedPhaseIdsRef.current = new Set(selectedIds);
    prevDefaultDataRef.current = defaultData;
    hasInitializedRef.current = true;

    setOptions(filteredPhases);
    setValue(selectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultData, masterPhases, pendingPhaseName]);

  // Sync ref when user manually changes selections via the combobox
  useEffect(() => {
    const checkedIds = new Set(options.filter((opt) => opt.checked).map((opt) => opt.value));
    selectedPhaseIdsRef.current = checkedIds;
  }, [options]);

  return (
    <DraggableCombobox
      options={options}
      onSearch={(q) =>
        getSearchedMasterPhases({ search: q, ...(projectTypeId ? { projectTypeId } : {}) })
      }
      searchedData={searchedData}
      searchedTotalCount={searchedData?.totalCount || 1}
      disabled={isSearchingPhases}
      onCreateFromSearch={onCreateFromSearch}
      onTaskClick={onPhaseClick}
      mapToOptions={(data) =>
        data?.masterPhases?.map((phase) => ({
          name: phase?.name,
          id: phase?.id,
        })) || []
      }
      setValue={setValue}
      setOptions={setOptions}
      label='Select Phases'
      error={error}
      {...props}
    />
  );
}
