import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  useGetProjectTypesQuery,
  useLazyGetProjectTypesQuery,
} from '../../../store/services/projectType/projectTypeSlice';
import DraggableCombobox from '../DraggableCombobox';
import type { TOption } from '../../../types/project';

type TProjectTypeMultiSelectorProps = {
  setValue: (val: string[]) => void;
  options: TOption[];
  setOptions: Dispatch<SetStateAction<TOption[]>>;
  defaultData?: { id: string; name: string }[];
  onCreateFromSearch?: (search: string) => void;
  pendingTypeName?: string | null;
  onTypeClick?: (typeId: string) => void;
  error?: string;
  projectTypeGroupId?: string | null;
  label?: string;
  className?: string;
  /** When true, fetches all templates without requiring projectTypeGroupId (used when editing groups) */
  fetchAll?: boolean;
};

export default function ProjectTypeMultiSelector({
  defaultData,
  setOptions,
  setValue,
  onCreateFromSearch,
  pendingTypeName,
  options,
  onTypeClick,
  error,
  projectTypeGroupId,
  label = 'Timeline Templates',
  className,
  fetchAll = false,
  ...props
}: TProjectTypeMultiSelectorProps) {
  // When fetchAll is true, fetch all templates without filtering by group
  // When fetchAll is false, require projectTypeGroupId to fetch
  const shouldSkipQuery = !fetchAll && !projectTypeGroupId;

  // Use refetchOnMountOrArgChange to ensure fresh data when group changes
  const { data: projectTypes } = useGetProjectTypesQuery(
    {
      pageLimit: '100',
      ...(projectTypeGroupId ? { projectTypeGroupId } : {}),
    },
    {
      skip: shouldSkipQuery,
      refetchOnMountOrArgChange: true,
    },
  );
  const [getSearchedProjectTypes, { data: searchedData, isFetching: isSearching }] =
    useLazyGetProjectTypesQuery();

  // Track the last processed state to prevent infinite loops
  const lastProcessedRef = useRef<string | null>(null);

  // Populate options whenever projectTypes data changes
  useEffect(() => {
    // Clear options when no group selected and not in fetchAll mode
    if (!fetchAll && !projectTypeGroupId) {
      if (lastProcessedRef.current !== 'empty') {
        setOptions([]);
        setValue([]);
        lastProcessedRef.current = 'empty';
      }
      return;
    }

    // Wait for data
    if (!projectTypes?.projectTypes) return;

    // Create a unique key to track if we've already processed this exact state
    const stateKey = `${projectTypeGroupId}-${projectTypes.projectTypes.map((t) => t.id).join(',')}-${pendingTypeName || ''}`;
    if (lastProcessedRef.current === stateKey) return;

    // Build options from fetched data
    let filteredTypes: TOption[] = [];

    if (defaultData && defaultData.length > 0) {
      // Edit mode: merge defaultData (pre-selected) with fetched data
      const defaults = defaultData.map((type) => ({
        label: type?.name,
        value: type?.id,
        checked: true,
      }));
      const typesWhichAreNotInDefault = projectTypes.projectTypes
        .filter((type) => !defaults.find((t) => t.value === type?.id))
        .map((type) => ({
          label: type?.name,
          value: type?.id,
          checked: false,
        }));
      filteredTypes = defaults.concat(typesWhichAreNotInDefault);
    } else {
      // Create mode: all options unchecked initially
      filteredTypes = projectTypes.projectTypes.map((type) => ({
        label: type?.name,
        value: type?.id,
        checked: false,
      }));
    }

    // Auto-select pending type if creating a new one
    if (pendingTypeName) {
      const newType = filteredTypes.find(
        (type) => type.label.toLowerCase() === pendingTypeName.toLowerCase(),
      );
      if (newType && !newType.checked) {
        filteredTypes = filteredTypes.map((type) =>
          type.value === newType.value ? { ...type, checked: true } : type,
        );
      }
    }

    const selectedIds = filteredTypes.filter((o) => o.checked).map((o) => o.value);
    lastProcessedRef.current = stateKey;
    setOptions(filteredTypes);
    setValue(selectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTypes, projectTypeGroupId, fetchAll, defaultData, pendingTypeName]);

  const noOptionsPlaceholder = fetchAll
    ? 'No timeline templates available.'
    : !projectTypeGroupId
      ? 'Select a Project Type Group first.'
      : 'No timeline templates for this group.';

  return (
    <DraggableCombobox
      options={options}
      onSearch={(q) =>
        getSearchedProjectTypes({
          search: q,
          ...(projectTypeGroupId ? { projectTypeGroupId } : {}),
        })
      }
      searchedData={searchedData}
      searchedTotalCount={searchedData?.totalCount || 1}
      disabled={isSearching || (!fetchAll && !projectTypeGroupId)}
      onCreateFromSearch={onCreateFromSearch}
      onTaskClick={onTypeClick}
      mapToOptions={(data) =>
        data?.projectTypes?.map((type) => ({
          name: type?.name,
          id: type?.id,
        })) || []
      }
      setValue={setValue}
      setOptions={setOptions}
      label={label}
      error={error}
      className={className}
      noOptionsPlaceholder={noOptionsPlaceholder}
      {...props}
    />
  );
}
