import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useGetMasterPhasesQuery,
  useLazyGetMasterPhasesQuery,
} from '../../../store/services/masterPhase/masterPhase';
import type { TOption } from '../../../types/common.types';
import type { TMasterPhase } from '../../../store/types/masterPhase.types';
import SearchableCombobox from '../SearchableCombobox';

export type TMasterPhaseComboboxProps = {
  value: string[];
  setValue: (id: string[]) => void;
  error?: string | string[] | undefined;
  disabled?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
  name: string;
  setTouched: (arg: boolean) => void;
  defaultData?: TOption[];
  projectTypeId?: string; // Filter phases by project type
};

const PAGE_LIMIT = 20;

// Helper function to format phase label with project type names
function formatPhaseLabel(phase: TMasterPhase): string {
  const projectTypeNames = phase.projectType
    ?.map((pt) => pt.ProjectType?.name)
    .filter(Boolean)
    .join(', ');
  return projectTypeNames ? `${phase.name} (${projectTypeNames})` : phase.name;
}

export default function MasterPhaseCombobox({
  projectTypeId,
  ...props
}: TMasterPhaseComboboxProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchPageRef = useRef<number>(0);

  // Initial load - first page only (filter by projectTypeId if provided)
  const { data: initialData } = useGetMasterPhasesQuery({
    pageLimit: PAGE_LIMIT.toString(),
    pageNo: '0',
    ...(projectTypeId ? { projectTypeId } : {}),
  });

  const [triggerSearchPhases, { data: searchedData, isFetching: isSearching }] =
    useLazyGetMasterPhasesQuery();

  // Load more for initial data (non-search mode)
  const [triggerLoadMore, { data: loadMoreData, isFetching: isLoadingMore }] =
    useLazyGetMasterPhasesQuery();

  // Accumulate initial data pages
  const [accumulatedInitialData, setAccumulatedInitialData] = useState<{
    masterPhases: TMasterPhase[];
    totalCount: number;
  } | null>(null);

  // Accumulate search results
  const [accumulatedSearchedData, setAccumulatedSearchedData] = useState<{
    masterPhases: TMasterPhase[];
    totalCount: number;
  } | null>(null);

  // Initialize accumulated initial data
  useEffect(() => {
    if (initialData) {
      setAccumulatedInitialData((prev) => {
        if (!prev) {
          return initialData;
        }
        // If we already have data, merge new initial data (shouldn't happen often, but handle it)
        const existingIds = new Set(prev.masterPhases.map((p) => p.id));
        const newPhases = initialData.masterPhases.filter((p) => !existingIds.has(p.id));
        return {
          masterPhases: [...prev.masterPhases, ...newPhases],
          totalCount: initialData.totalCount,
        };
      });
    }
  }, [initialData]);

  // Accumulate load more data for initial list
  useEffect(() => {
    if (loadMoreData && !searchQuery) {
      setAccumulatedInitialData((prev) => {
        if (!prev) return loadMoreData;
        const existingIds = new Set(prev.masterPhases.map((p) => p.id));
        const newPhases = loadMoreData.masterPhases.filter((p) => !existingIds.has(p.id));
        return {
          masterPhases: [...prev.masterPhases, ...newPhases],
          totalCount: loadMoreData.totalCount,
        };
      });
    }
  }, [loadMoreData, searchQuery]);

  // Handle search with pagination
  const handleSearch = useCallback(
    (q: string, pageNo: number = 0) => {
      if (q && q.trim()) {
        setSearchQuery(q);
        searchPageRef.current = pageNo;
        triggerSearchPhases({
          search: q,
          pageLimit: PAGE_LIMIT.toString(),
          pageNo: pageNo.toString(),
          ...(projectTypeId ? { projectTypeId } : {}),
        });
      } else {
        // Clear search - reset everything
        setSearchQuery('');
        searchPageRef.current = 0;
        setAccumulatedSearchedData(null);
      }
    },
    [triggerSearchPhases, projectTypeId],
  );

  // Accumulate search results
  useEffect(() => {
    if (searchedData) {
      if (searchPageRef.current === 0) {
        // First page - replace
        setAccumulatedSearchedData(searchedData);
      } else {
        // Subsequent pages - append
        setAccumulatedSearchedData((prev) => {
          if (!prev) return searchedData;
          const existingIds = new Set(prev.masterPhases.map((p) => p.id));
          const newPhases = searchedData.masterPhases.filter((p) => !existingIds.has(p.id));
          return {
            masterPhases: [...prev.masterPhases, ...newPhases],
            totalCount: searchedData.totalCount,
          };
        });
      }
    }
  }, [searchedData]);

  // Handle load more for initial data
  const handleLoadMore = useCallback(() => {
    if (accumulatedInitialData) {
      const nextPage = Math.floor(accumulatedInitialData.masterPhases.length / PAGE_LIMIT);
      triggerLoadMore({
        pageLimit: PAGE_LIMIT.toString(),
        pageNo: nextPage.toString(),
        ...(projectTypeId ? { projectTypeId } : {}),
      });
    }
  }, [accumulatedInitialData, triggerLoadMore, projectTypeId]);

  // Calculate if there are more pages for initial data
  const initialHasMore =
    accumulatedInitialData && accumulatedInitialData.totalCount
      ? accumulatedInitialData.masterPhases.length < accumulatedInitialData.totalCount
      : false;

  // Calculate if there are more pages for search
  const searchHasMore =
    accumulatedSearchedData && accumulatedSearchedData.totalCount
      ? accumulatedSearchedData.masterPhases.length < accumulatedSearchedData.totalCount
      : false;

  // Determine which data to use
  const isSearchMode = searchQuery.length > 0;
  const displayData = isSearchMode ? accumulatedSearchedData : accumulatedInitialData;
  const hasMore = isSearchMode ? searchHasMore : initialHasMore;
  const isLoadingMoreData = isLoadingMore && !isSearchMode;

  // Handle load more for search
  const handleSearchLoadMore = useCallback(() => {
    if (isSearchMode && searchQuery) {
      const nextPage = searchPageRef.current + 1;
      searchPageRef.current = nextPage;
      triggerSearchPhases({
        search: searchQuery,
        pageLimit: PAGE_LIMIT.toString(),
        pageNo: nextPage.toString(),
        ...(projectTypeId ? { projectTypeId } : {}),
      });
    }
  }, [isSearchMode, searchQuery, triggerSearchPhases, projectTypeId]);

  return (
    <SearchableCombobox
      label=''
      placeholder='Select Phases'
      searchedData={displayData}
      onSearch={handleSearch}
      mapToOptions={(data) =>
        data?.masterPhases?.map((p) => ({
          label: formatPhaseLabel(p),
          value: p.id,
        })) || []
      }
      isSearching={isSearching && searchPageRef.current === 0}
      initialData={accumulatedInitialData || initialData}
      totalCount={displayData?.totalCount}
      onLoadMore={isSearchMode ? handleSearchLoadMore : handleLoadMore}
      isLoadingMore={isLoadingMoreData || (isSearching && searchPageRef.current > 0)}
      hasMore={hasMore}
      {...props}
    />
  );
}
